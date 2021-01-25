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
  
  static deposit(wallet: Wallet, channelId: string, expectHeld: BigNumber, value: BigNumber): Promise<DepositedEvent> {
    return StateChannel.externalDeposit(wallet, channelId, expectHeld, value);
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
      event: {handshakeId}
    };
  }

  private async handshakeBack(handshakeId: string, dest: string): Promise<Payload> {
    const myaddress = await this.address;
    const statechannel = await StateChannel.createFromScratch(this._wallet, this._chainId, [myaddress, dest]);
    this._channels.set(dest, statechannel);
    const signed = statechannel.getSignedState(myaddress);

    //const amount = parseUnits("1000000", "gwei").toHexString();
    //statechannel.deposit(amount);
    const { channelId } = statechannel;
    return { 
      from: myaddress,
      type: 'handshake',
      signed,
      event: {handshakeId, channelId},
    };
  }

  async received({from, type, signed, event} : Payload) {
    const myaddress = await this.address;
    switch(type) {
      case 'handshake': {
        if (signed) {
          const statechannel = StateChannel.createFromState(this._wallet, event.channelId, from, signed);
          this._channels.set(from, statechannel);
          return this.emit("handshakeBack", from, event.handshakeId, event.channelId);
        }
        return this.emit("handshake", from, event.handshakeId);
      }

      case 'deposit': {
        const statechannel = this.getChannel(from);
        statechannel.update(from, signed);
        return this.emit("deposited", from, BigNumber.from(event.amount));
      }

      case 'request': {
        const statechannel = this.getChannel(from);
        statechannel.update(from, signed);

        //assert(myaddress === destination, `address not match: ${myaddress} !== ${allocationAddress}`);
        const response = async() => ({
          from: myaddress,
          type: 'transfer',
          signed: {
            state: signed.state,
            signature: await sign(this._wallet.getSigner(), signed.state),
          },
          event: {amount: event.amount}
        });
        return this.emit("requested", from, BigNumber.from(event.amount), response);
      }

      case 'transfer': {
        const statechannel = this.getChannel(from);
        statechannel.update(from, signed);
        return this.emit("received", from, BigNumber.from(event.amount));
      }

      case 'finalize': {
        const statechannel = this.getChannel(from);
        statechannel.update(from, signed);
        if (!statechannel.getSignedState(myaddress).state.isFinal) {
          const signed = await statechannel.finalize();
          statechannel.update(myaddress, signed);
        }
        if (statechannel.isConcludable()) {
          const log = await statechannel.conclude();
          return this.emit("finalized", from, log);
        }
      }
    }
  }


  async request(fromAddress: string, amount: BigNumber): Promise<Payload> {
    const statechannel = this.getChannel(fromAddress);
    const myAddress = await this.address;
    return {
      from: myAddress,
      type: 'request',
      signed: await statechannel.request(fromAddress, myAddress, amount),
      event: {amount: amount.toHexString()}
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
  getChannel(address: string) {
    const channel = this._channels.get(address);
    if (!channel) throw new Error(`channel of address ${address} not found`);
    return channel;
  }

}  //end class StateChannelManager


