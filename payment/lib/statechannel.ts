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
  public signed: SignedState;
  public readonly channelId: string;

  constructor(
    chainId: string,
    participants: string[],
    private readonly wallet: Wallet,
  ) {
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

    const channel = createChannel(chainId, [...participants, wallet.getAddress()]);
    this.channelId = getChannelId(channel);
    this.signed.state = createState(channel);
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
    if (address !== this.wallet.getAddress()) {
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

