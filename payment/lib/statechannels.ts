import EventEmitter from "events";
import {utils, BigNumber} from "ethers";
import {State, Channel, getChannelId, SignedState, AllocationAssetOutcome} from "@statechannels/nitro-protocol";
import { sign } from './utils';
import { strict as assert } from 'assert';

import {PaymentInterface} from "./interface";
import {Wallet} from './wallet';
import {StateChannel} from './statechannel';

const { parseUnits } = utils;

declare type Shake = {
  channelId?: string;
  signed?: SignedState;
};

declare type Payload = {
  from: string,
  type: 'handshake' | 'request' | 'transfer' | 'finalize';
  content: Shake | SignedState;
};

/**
 * only support two participants and single directional transfer for now
 */
export class StateChannelsPayment extends EventEmitter implements PaymentInterface<Payload, Shake> {

  private _channels = new Map<string, StateChannel>();

  constructor(private readonly _wallet: Wallet) {
    super();
  }

  private get address() {
    return this._wallet.getAddress();
  }


  async handshake(address: string, shake?:Shake): Promise<Payload> {
    if (shake) {
      const chainId = process.env.DAPP_CHAIN_ID

      const statechannel = new StateChannel(chainId, [address], this._wallet);
      this._channels.set(address, statechannel);

      //const amount = parseUnits("1000000", "gwei").toHexString();
      //statechannel.deposit(amount);
      const { signed, channelId } = statechannel;
      shake = { ...shake, signed, channelId };
    } 
    return { 
      from: this._wallet.getAddress(),
      type: 'handshake',
      content: shake 
    };
  }

  received({from, type, content} : Payload) {
    switch(type) {
      case 'handshake': {
        const shake = content as Shake;
        return this.emit("handshake", from, shake);
      }

      case 'request': {
        const signed = content as SignedState;
        const statechannel = this.getChannel(from);
        statechannel.update(signed);

        const address = this._wallet.getAddress();
        const {address: allocationAddress, amount} = extractLastAllocationItem(signed.state);
        assert(address === allocationAddress);
        const response = async() => ({ 
          from: address,
          type: 'transfer',
          content: await sign(this._wallet.getMessageSigner(), signed.state) 
        });
        return this.emit("requested", from, amount, response);
      }

      case 'transfer': {
        const signed = content as SignedState;
        const statechannel = this.getChannel(from);
        statechannel.update(signed);

        const { amount } = extractLastAllocationItem(signed.state);
        return this.emit("received", from, amount);
      }

      case 'finalize': {
        const signed = content as SignedState;
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
      content: await statechannel.payout(address, amount),
    }
  }

  async finalize(address: string, remain: BigNumber): Promise<Payload> {
    const statechannel = this.getChannel(address);
    const signed = await statechannel.payout(this.address, remain);
    statechannel.update(signed);
    return {
      from: this.address,
      type: 'request',
      content: await statechannel.requestConclude()
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


