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
  private expectedHeld = BigNumber.from(0);
  private _channelId: string;

  public signed: SignedState;
  public get channelId() { return this._channelId; }

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
    signed: SignedState
  ): StateChannel {
    const instance = new StateChannel(wallet);
    instance._channelId = channelId;
    instance.update(signed);
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

  get state(): State {
    return this.signed.state;
  }

  get remain(): BigNumber {
    return this.expectedHeld;
  }

  update(signed: SignedState): void {
    this.signed = signed;
  }

  async deposit(value: BigNumber) {
    const { amountDeposited } = await nitro.deposit(this.ethAssetHolder, this.channelId, this.expectedHeld, value);
    this.expectedHeld = amountDeposited;
  }

  async payout(address: string, value: BigNumber): Promise<SignedState> {
    const signer = this.wallet.getMessageSigner();
    this.signed = await nitro.transfer(signer, this.state, address, value);
    if (address !== await this.wallet.getAddress()) {
      this.expectedHeld = this.expectedHeld.sub(value);
    }
    return this.signed;
  }

  async requestConclude(): Promise<SignedState> {
    const { state } = this;
    state.isFinal = true;
    state.turnNum += 1;

    const signer = this.wallet.getMessageSigner();
    const signature = await sign(signer, state);

    return { state, signature };
  }

  async conclude(signed: SignedState) {
    const { state } = this.signed = signed;
    const signer = this.wallet.getMessageSigner();
    const signature = await sign(signer, state);
    const event =  nitro.conclude(state, [signed.signature, signature]);
    return nitro.lookupConclusion(event, [this.ethAssetHolder, this.nitroAdjudicator]);
  }

}

