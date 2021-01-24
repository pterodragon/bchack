import {EventEmitter} from 'events';
import { BigNumber } from "ethers";
import {State, SignedState, AllocationAssetOutcome} from "@statechannels/nitro-protocol";
import { sign } from './utils';
import {PaymentInterface} from "./interface";
import {Wallet} from './wallet';
import {StateChannel} from './statechannel';



declare type Payload = {
  from: string,
  type: 'handshake' | 'deposit' | 'request' | 'transfer' | 'finalize';
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
    const signed = statechannel.getSignedState(myaddress);

    //const amount = parseUnits("1000000", "gwei").toHexString();
    //statechannel.deposit(amount);
    const { channelId } = statechannel;
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
          const statechannel = StateChannel.createFromState(this._wallet, shake.channelId, from, signed);
          this._channels.set(from, statechannel);
          return this.emit("handshakeBack", from, shake.handshakeId);
        }
        return this.emit("handshake", from, shake.handshakeId);
      }

      case 'deposit': {
        const statechannel = this.getChannel(from);
        statechannel.update(from, signed);
        return this.emit("requested", from, amount, response);
      }

      case 'request': {
        const statechannel = this.getChannel(from);
        statechannel.update(from, signed);

        const myaddress = await this._wallet.getAddress();
        const {destination, amount} = extractLastAllocationItem(signed.state);
        //assert(myaddress === destination, `address not match: ${myaddress} !== ${allocationAddress}`);
        const response = async() => ({
          from: myaddress,
          type: 'transfer',
          signed: {
            state: signed.state,
            signature: await sign(this._wallet.getMessageSigner(), signed.state) 
          }
        });
        return this.emit("requested", from, amount, response);
      }

      case 'transfer': {
        const statechannel = this.getChannel(from);
        statechannel.update(from, signed);
const { amount } = extractLastAllocationItem(signed.state);
        return this.emit("received", from, amount);
      }

      case 'finalize': {
        const statechannel = this.getChannel(from);
        statechannel.update(from, signed);

        const eventLog = await statechannel.conclude(signed);
        return this.emit("finalized", from, eventLog);
      }
    }
  }


  async request(fromAddress: string, amount: BigNumber): Promise<Payload> {
    const statechannel = this.getChannel(fromAddress);
    const myAddress = await this.address;
    return {
      from: myAddress,
      type: 'request',
      signed: await statechannel.payout(myAddress, amount),
    }
  }

  async finalize(address: string): Promise<Payload> {
    const myaddress = await this.address;
    const statechannel = this.getChannel(address);
    return {
      from: myaddress,
      type: 'finalize',
      signed: await statechannel.requestConclude()
    }
  }


  async deposit(address: string, amount: BigNumber): Promise<Payload> {
    const myaddress = await this.address;
    const statechannel = this.getChannel(address);
    return {
      from: myaddress,
      type: 'deposit',
      signed: await statechannel.deposit(amount)
    };
  }
  

  //public for unit testing
  getChannel(address: string) {
    const channel = this._channels.get(address);
    if (!channel) throw new Error(`channel of address ${address} not found`);
    return channel;
  }

}  //end class StateChannelManager


//export for unit test
export function extractLastAllocationItem(state: State) {
    const {outcome} = state;
    const allocation = outcome[outcome.length-1] as AllocationAssetOutcome;
    const {allocationItems} = allocation;
    const lastItem = allocationItems[allocationItems.length-1]
    const {destination} = lastItem;
    const amount = BigNumber.from(lastItem.amount);
    return { destination, amount }
}


