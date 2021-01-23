import {EventEmitter} from 'events';
import { BigNumber } from "ethers";
import {State, SignedState, AllocationAssetOutcome} from "@statechannels/nitro-protocol";
import { sign } from './utils';
import { strict as assert } from 'assert'; 
import {PaymentInterface} from "./interface";
import {Wallet} from './wallet';
import {StateChannel} from './statechannel';



declare type Payload = {
  from: string,
  type: 'handshake' | 'request' | 'transfer' | 'finalize';
  signed?: SignedState;
  shake?: {handshakeId:string, channelId?:string},
};

/**
 * only support two participants and single directional transfer for now
 */
export class StateChannelsPayment extends EventEmitter implements PaymentInterface<Payload> {

  private _channels = new Map<string, StateChannel>();

  constructor(
    private readonly _wallet: Wallet,
    private readonly _chainId: string = process.env.CHAIN_NETWORK_ID
  ) {
    super();
  }

  private get address() {
    return this._wallet.getAddress();
  }


  async handshake(handshakeId: string, address?: string): Promise<Payload> {
    if (address) {
      return this.handshakeBack(handshakeId, address);
    }
    return { 
      from: await this.address,
      type: 'handshake',
      shake: {handshakeId}
    };
  }

  private async handshakeBack(handshakeId: string, dest: string): Promise<Payload> {
    const myaddress = await this.address;
    const statechannel = StateChannel.createFromScratch(this._wallet, this._chainId, [dest, myaddress]);
    this._channels.set(dest, statechannel);

    //const amount = parseUnits("1000000", "gwei").toHexString();
    //statechannel.deposit(amount);
    const { signed, channelId } = statechannel;
    return { 
      from: myaddress,
      type: 'handshake',
      shake: {handshakeId, channelId},
      signed
    };
  }

  async received({from, type, signed, shake} : Payload) {
    switch(type) {
      case 'handshake': {
        if (signed) {
          if (!shake) throw new Error(`no handshakeId in handshake paylaod from ${from}`);
          const statechannel = StateChannel.createFromState(this._wallet, shake.channelId, signed);
          this._channels.set(from, statechannel);
          return this.emit("handshakeBack", shake.handshakeId, from);
        }
        return this.emit("handshake", shake.handshakeId, from);
      }

      case 'request': {
        const statechannel = this.getChannel(from);
        statechannel.update(signed);

        const address = await this._wallet.getAddress();
        const {address: allocationAddress, amount} = extractLastAllocationItem(signed.state);
        assert(address === allocationAddress);
        const response = async() => ({ 
          from: address,
          type: 'transfer',
          signed: await sign(this._wallet.getMessageSigner(), signed.state) 
        });
        return this.emit("requested", from, amount, response);
      }

      case 'transfer': {
        const statechannel = this.getChannel(from);
        statechannel.update(signed);

        const { amount } = extractLastAllocationItem(signed.state);
        return this.emit("received", from, amount);
      }

      case 'finalize': {
        const statechannel = this.getChannel(from);
        statechannel.conclude(signed);
      }
    }
  }


  async request(address: string, amount: BigNumber): Promise<Payload> {
    const statechannel = this.getChannel(address);
    return {
      from: await this.address,
      type: 'request',
      signed: await statechannel.payout(address, amount),
    }
  }

  async finalize(address: string): Promise<Payload> {
    const myaddress = await this.address;
    const statechannel = this.getChannel(address);
    const signed = await statechannel.payout(myaddress, statechannel.remain);
    statechannel.update(signed);
    return {
      from: myaddress,
      type: 'request',
      signed: await statechannel.requestConclude()
    }
  }


  async deposit(address: string, amount: BigNumber): Promise<boolean> {
    try {
      const statechannel = this.getChannel(address);
      await statechannel.deposit(amount);
      return true;
    } catch(err) {
      return false;
    }
  }
  

  //public for unit testing
  getChannel(address: string) {
    const channel = this._channels.get(address);
    if (!channel) throw new Error(`channel of address ${address} not found`);
    return channel;
  }

}  //end class StateChannelManager


function extractLastAllocationItem(state: State) {
    const {outcome} = state;
    const allocation = outcome[outcome.length-1] as AllocationAssetOutcome;
    const {allocationItems} = allocation;
    const address = allocation.assetHolderAddress;
    const amount = BigNumber.from(allocationItems[allocationItems.length-1].amount);
    return { address, amount }
}


