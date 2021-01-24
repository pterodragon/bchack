import { Signature, BigNumber } from "ethers";
import { ethers, Signer } from "ethers"
import { Wallet } from "./wallet/wallet";
import {createChannel,createState} from './utils';
import { sign } from './utils';
import * as nitro from "./nitro";


import {
  ContractArtifacts, getChannelId, Channel, State, SignedState,
} from "@statechannels/nitro-protocol";


export class StateChannel {
  private readonly nitroAdjudicator: ethers.Contract;
  private readonly ethAssetHolder: ethers.Contract;
  private _holdings = BigNumber.from(0);
  private _channelId: string;
  //mapping between participants(publickey) and their latest signed state
  private _signedStates = new Map<string, SignedState>();

  static createFromScratch(
    wallet: Wallet,
    chainId: string,
    participants: string[],
  ): StateChannel {
    const instance = new StateChannel(wallet);
    const channel = createChannel(chainId, participants);
    instance._channelId = getChannelId(channel);
    //@ts-expect-error
    instance.signed = { state: createState(channel) };
    return instance;
  }

  static createFromState(
    wallet: Wallet,
    channelId: string,
    from: string,
    signed: SignedState
  ): StateChannel {
    const instance = new StateChannel(wallet);
    instance._channelId = channelId;
    instance.update(from, signed);
    return instance;
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
    let maxTurnNum = -1;
    let ret = undefined;
    for (let [address, {state}] of this._signedStates) {
      if (state.turnNum > maxTurnNum) {
        maxTurnNum = state.turnNum;
        ret = state;
      }
    }
    return ret;
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
    const { destinationHoldings } = await nitro.deposit(this.ethAssetHolder, this.channelId, this._holdings, value);
    this._holdings = destinationHoldings;
    const state = nitro.add(this.latestState, await this.address, value);

    const signer = this.wallet.getMessageSigner();
    const signature = await sign(signer, state);

    const signed = { state, signature };
    return this.update(await this.address, signed);
  }

  async payout(address: string, value: BigNumber): Promise<SignedState> {

    let state = nitro.sub(this.latestState, await this.address, value);
    state = nitro.add(state, address, value);

    const signer = this.wallet.getMessageSigner();
    const signature = await sign(signer, state);

    const signed = { state, signature };
    return this.update(await this.address, signed);
  }

  async requestConclude(): Promise<SignedState> {
    const { latestState: state } = this;
    state.isFinal = true;
    state.turnNum += 1;

    const signer = this.wallet.getMessageSigner();
    const signature = await sign(signer, state);

    return { state, signature };
  }

  async conclude(signed: SignedState) {
    const { state } = this.signed = signed;
    const signer = this.wallet.getMessageSigner();
    const mysignature = await sign(signer, state);
    const event = await nitro.conclude(this.nitroAdjudicator, state, [mysignature, signed.signature]);
    return nitro.explainConclusion(event, [this.ethAssetHolder, this.nitroAdjudicator]);
  }

}

