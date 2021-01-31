import {EventEmitter} from 'events';
import { BigNumber } from "ethers";
import { SignedState, DepositedEvent } from "@statechannels/nitro-protocol";
import { sign } from './utils';
import {PaymentInterface} from "./interface";
import {Wallet} from './wallet/wallet';
import {StateChannel} from './statechannel';



declare type Payload = {
  from: string,
  type: 'handshake' | 'deposit' | 'request' | 'transfer' | 'finalize';
  signed?: SignedState;
  event: any;
};

/*
export interface StateChannelsPayment extends PaymentInterface<Payload> {
  on(event: 'stateUpdated', listener: (address: string, channelId: string, signed: SignedState)=>void): this;
};
*/

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
  
  static deposit(wallet: Wallet, channelId: string, expectHeld: BigNumber, value: BigNumber): Promise<BigNumber> {
    return StateChannel.externalDeposit(wallet, channelId, expectHeld, value);
  }

  private get address() {
    return this._wallet.getAddress();
  }


  async handshake(handshakeId: string, address?: string, expected?: BigNumber): Promise<Payload> {
    if (address) {
      //handshake back
      const myaddress = await this.address;
      const statechannel = await StateChannel.createFromScratch(this._wallet, this._chainId, [myaddress, address]);
      this._channels.set(address, statechannel);
      const signed = statechannel.getSignedState(myaddress);
      this.emit('stateUpdated', address, statechannel.channelId, signed);

      const { channelId } = statechannel;
      const event = expected ? { handshakeId, channelId, expected:expected.toHexString() } : { handshakeId, channelId };

      return { 
        from: myaddress,
        type: 'handshake',
        signed,
        event
      };
    }
    return { 
      from: await this.address,
      type: 'handshake',
      event: {handshakeId}
    };
  }


  async received({from, type, signed, event} : Payload,  meta?: any) {
    const myaddress = await this.address;
    if (type === 'handshake') {
        if (signed) { //from a handshake back
          const statechannel = StateChannel.createFromState(this._wallet, event.channelId, from, signed);
          this._channels.set(from, statechannel);
          this.emit('stateUpdated', from, statechannel.channelId, signed);
          return this.emit("handshakeBack", from, event.handshakeId, event.channelId, event.expected && BigNumber.from(event.expected), meta);
        }
        return this.emit("handshake", from, event.handshakeId, meta);
    }

    const statechannel = this.getChannel(from);
    statechannel.update(from, signed);
    this.emit('stateUpdated', from, statechannel.channelId, signed);

    switch(type) {
      case 'deposit': {
        return this.emit("deposited", from, BigNumber.from(event.amount), meta);
      }

      case 'request': {
        //assert(myaddress === destination, `address not match: ${myaddress} !== ${allocationAddress}`);
        const respond = async() => ({
          from: myaddress,
          type: 'transfer',
          signed: {
            state: signed.state,
            signature: await sign(this._wallet.getSigner(), signed.state),
          },
          event: event.requestId ?  {amount: event.amount, requestId: event.requestId} : {amount: event.amount}
        });
        return this.emit("requested", from, BigNumber.from(event.amount), respond, meta);
      }

      case 'transfer': {
        return this.emit("received", from, BigNumber.from(event.amount), event.requestId, meta);
      }

      case 'finalize': {
        if (!statechannel.getSignedState(myaddress).state.isFinal) {
          const signed = await statechannel.finalize();
          statechannel.update(myaddress, signed);
        }
        if (statechannel.isConcludable()) {
          const log = await statechannel.conclude();
          return this.emit("finalized", from, log, meta);
        }
      }
    }
  }


  async request(fromAddress: string, amount: BigNumber, requestId?: string): Promise<Payload> {
    const statechannel = this.getChannel(fromAddress);
    const myAddress = await this.address;
    const event = requestId ? {amount: amount.toHexString(), requestId} : {amount: amount.toHexString()};
    return {
      from: myAddress,
      type: 'request',
      signed: await statechannel.request(fromAddress, myAddress, amount),
      event 
    }
  }

  async finalize(address: string): Promise<Payload> {
    const myaddress = await this.address;
    const statechannel = this.getChannel(address);
    return {
      from: myaddress,
      type: 'finalize',
      signed: await statechannel.finalize(),
      event: {}
    }
  }


  async deposit(address: string, amount: BigNumber): Promise<Payload> {
    const myaddress = await this.address;
    const statechannel = this.getChannel(address);
    return {
      from: myaddress,
      type: 'deposit',
      signed: await statechannel.deposit(amount),
      event: {amount: amount.toHexString()}
    };
  }
  

  //public for unit testing
  getChannel(address: string): StateChannel {
    const channel = this._channels.get(address);
    if (!channel) throw new Error(`channel of address ${address} not found`);
    return channel;
  }


}  //end class StateChannelManager


