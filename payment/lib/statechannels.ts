import EventEmitter from "events";
import {utils, sign, BigNumber} from "ethers";
import {State, Channel, getChannelId, SignedState} from "@statechannels/nitro-protocol";
import {PaymentInterface} from "./interface";
import {Wallet} from './wallet';
import {StateChannel} from './statechannel';
import {createChannel,createState} from './utils';

const { parseUnits } = utils;

declare type Shake = {
  address: string;
  channelId?: string;
  state?: State;
};

declare type Payload = {
  type: 'shake' | 'state';
  content: Shake | SignedState;
};

export class StateChannelsPayment extends EventEmitter implements PaymentInterface<Payload, Shake> {

  private _channels = new Map<string, StateChannel>();

  constructor(private readonly _wallet: Wallet) {
    super();
  }

  private get address() {
    return this._wallet.getAddress();
  }

  async init() {

  }

  async handshake(shake?:Shake): Promise<Payload> {
    if (!shake) {
      shake = {address: this.address}
    } else {
      const chainId = process.env.DAPP_CHAIN_ID
      const participants = [shake.address, this.address];
      const channel = createChannel(chainId, participants);
      const state = createState(channel, participants);
      const channelId = getChannelId(channel);

      const statechannel = new StateChannel(channelId, this._wallet, channel);
      this._channels.set(shake.address, statechannel);

      //const amount = parseUnits("1000000", "gwei").toHexString();
      //statechannel.deposit(amount);
      shake = { ...shake, state, channelId };
    }

    return { type: 'shake', content: shake };
  }

  received(payload: Payload): void {
  }

  async transfer(dest: string, amount: BigNumber): Promise<Payload> {
  }

  async request(dest: string, amount: BigNumber): Promise<Payload> {
  }

  async finalize(): Promise<void> {
  }

  async hasCredit(address: string, amount: string): Promise<boolean> {
  }

  async topUp(address: string, amount: BigNumber): Promise<boolean> {
  }
}  //end class StateChannelManager


