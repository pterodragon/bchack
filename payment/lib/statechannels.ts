import {EventEmitter} from 'events';
import {utils, BigNumber} from "ethers";
import {State, Channel, getChannelId, SignedState, AllocationAssetOutcome} from "@statechannels/nitro-protocol";
import { sign } from './utils';
import { strict as assert } from 'assert';

import {PaymentInterface} from "./interface";
import {Wallet} from './wallet';
import {StateChannel} from './statechannel';



declare type Payload = {
  from: string,
  type: 'handshake' | 'request' | 'transfer' | 'finalize';
  channelId?: string;
  signed?: SignedState;
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


  async handshake(address?: string): Promise<Payload> {
    if (address) {
      return this.handshakeBack(address);
    }
    return { 
      from: this._wallet.getAddress(),
      type: 'handshake',
    };
  }

  async handshakeBack(dest: string): Promise<Payload> {
    const statechannel = StateChannel.createFromScratch(this._wallet, this._chainId, [dest, this._wallet.getAddress()]);
    this._channels.set(dest, statechannel);

    //const amount = parseUnits("1000000", "gwei").toHexString();
    //statechannel.deposit(amount);
    const { signed, channelId } = statechannel;
    return { 
      from: this._wallet.getAddress(),
      type: 'handshake',
      channelId ,
      signed
    };
  }

  received({from, type, signed, channelId} : Payload) {
    switch(type) {
      case 'handshake': {
        if (channelId && signed) {
          const statechannel = StateChannel.createFromState(this._wallet, channelId, signed);
          this._channels.set(from, statechannel);
          return;
        }
        return this.emit("handshake", from);
      }

      case 'request': {
        const statechannel = this.getChannel(from);
        statechannel.update(signed);

        const address = this._wallet.getAddress();
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
      from: this.address,
      type: 'request',
      signed: await statechannel.payout(address, amount),
    }
  }

  async finalize(address: string): Promise<Payload> {
    const statechannel = this.getChannel(address);
    const signed = await statechannel.payout(this.address, statechannel.remain);
    statechannel.update(signed);
    return {
      from: this.address,
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
  

  private getChannel(address: string) {
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


