import { Signature, BigNumber } from "ethers";
import { ethers, Signer } from "ethers"
import { Wallet } from "./wallet/wallet";
import {createChannel,createState} from './utils';
import { sign } from './utils';
import * as nitro from "./nitro";
import {
  ContractArtifacts, getChannelId, Channel, State, SignedState, DepositedEvent,
} from "@statechannels/nitro-protocol";

import createDebug from 'debug';
const log = createDebug('py.statechannel');


export class StateChannel {
  private readonly nitroAdjudicator: ethers.Contract;
  private readonly ethAssetHolder: ethers.Contract;
  private _holdings = BigNumber.from(0);
  private _channelId: string;
  //mapping between participants(publickey) and their latest signed state
  private _signedStates = new Map<string, SignedState>();

  static async createFromScratch(
    wallet: Wallet,
    chainId: string,
    participants: string[],
  ): Promise<StateChannel> {
    log('createFromScratch', {chainId, participants});
    const instance = new StateChannel(wallet);
    const channel = createChannel(chainId, participants);
    instance._channelId = getChannelId(channel);

    const myaddress = await wallet.getAddress();
    const state = createState(channel, 1);
    const signature = await sign(wallet.getSigner(), state);
    instance.update( myaddress,  { state, signature });
    return instance;
  }

  static createFromState(
    wallet: Wallet,
    channelId: string,
    from: string,
    signed: SignedState
  ): StateChannel {
    log('createFromState', {channelId, from, signed});
    const instance = new StateChannel(wallet);
    instance._channelId = channelId;
    instance.update(from, signed);
    return instance;
  }

  static externalDeposit(wallet: Wallet, channelId: string, expectHeld:BigNumber, value: BigNumber): Promise<DepositedEvent> {
    log('externalDeposit', {channelId, expectHeld, value});
    const ethAssetHolder = new ethers.Contract(
      nitro.ETH_ASSET_HOLDER_ADDRESS,
      ContractArtifacts.EthAssetHolderArtifact.abi,
      wallet.getConstractSigner()
    );
    return nitro.deposit(ethAssetHolder, channelId, expectHeld, value);
  }

  private constructor( private readonly wallet: Wallet) { 
    this.nitroAdjudicator = new ethers.Contract(
      nitro.NITRO_ADJUDICATOR_ADDRESS,
      ContractArtifacts.NitroAdjudicatorArtifact.abi,
      wallet.getConstractSigner()
    );
    this.ethAssetHolder = new ethers.Contract(
      nitro.ETH_ASSET_HOLDER_ADDRESS,
      ContractArtifacts.EthAssetHolderArtifact.abi,
      wallet.getConstractSigner()
    );
  }

  get channelId(): string { 
    return this._channelId; 
  }

  get latestState(): State {
    return Array.from(this._signedStates).reduce((ret, [_, {state}])=>
      (ret && (ret.turnNum > state.turnNum)) ? ret : state
    , undefined as State);
  }

  getSignedState(whoSigned: string): SignedState {
      const signed = this._signedStates.get(whoSigned);
      if (!signed) throw new Error(`signed state of ${whoSigned} not found`);
      return signed;
  }

  get holdings(): BigNumber {
    return this._holdings;
  }

  private get address(): Promise<string> {
    return this.wallet.getAddress();
  }

  update(participant: string, signed: SignedState): SignedState {
    this._signedStates.set(participant, signed);
    return signed;
  }

  async deposit(value: BigNumber): Promise<SignedState> {
    log('deposit', value);
    const { destinationHoldings } = await nitro.deposit(this.ethAssetHolder, this.channelId, this._holdings, value);
    this._holdings = destinationHoldings;
    const state = nitro.add(this.latestState, await this.address, value);

    const signer = this.wallet.getSigner();
    const signature = await sign(signer, state);

    const signed = { state, signature };
    return this.update(await this.address, signed);
  }

  async request(from: string, to: string, value: BigNumber): Promise<SignedState> {
    log('request', {from, to, value});
    let state = nitro.sub(this.latestState, from, value);
    state = nitro.add(state, to, value);
    state.turnNum += 1;

    const signer = this.wallet.getSigner();
    const signature = await sign(signer, state);

    return { state, signature };
  }

  isConcludable(): boolean {
    return Array.from(this._signedStates).reduce((ret, [_, signed])=>{
      if (ret === -1) return -1;
      if (ret > 0 && ret != signed.state.turnNum) return -1;
      if (!signed.signature) return -1;
      if (!signed.state.isFinal) return -1; return Math.max(ret, signed.state.turnNum); }, 0) > 0;
  }

  async finalize(): Promise<SignedState> {
    log('finalize');
    const { latestState: state } = this;
    state.isFinal = true;

    const signer = this.wallet.getSigner();
    const signature = await sign(signer, state);

    return { state, signature };
  }

  async conclude() {
    log('conclude');
    //if (!this.isConcludable()) throw new Error(`statechannel ${this._channelId} is not concludable`);
    
    const state = this.latestState;
    log('latestState', JSON.stringify(state));
    const {participants} = state.channel;
    const signatures = participants.map((addr)=>this.getSignedState(addr).signature);
    const event = await nitro.conclude(this.nitroAdjudicator, this.latestState, signatures);
    return nitro.explainConclusion(event, [this.ethAssetHolder, this.nitroAdjudicator]);
  }

  async updateHolding(): Promise<BigNumber> {
    log('updateHolding');
    this._holdings = await this.ethAssetHolder.holdings(this._channelId);
    return this._holdings;
  }
}

