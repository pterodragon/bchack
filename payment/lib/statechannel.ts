import { Signature, BigNumber } from "ethers";
import { ethers, Signer } from "ethers"
import { Wallet } from "./wallet/wallet";
import { sign, compileEventsFromLogs } from './utils';


import {
  ContractArtifacts,
  Channel, State, Outcome, AllocationAssetOutcome, SignedState,
  getDepositedEvent, signStates,
  getFixedPart, getVariablePart, hashAppPart, hashOutcome, encodeOutcome,
  convertAddressToBytes32
} from "@statechannels/nitro-protocol";

const ETH_ASSET_HOLDER_ADDRESS = process.env.ETH_ASSET_HOLDER_ADDRESS || '';

export class StateChannel {
  private nitroAdjudicator: ethers.Contract;
  private ethAssetHolder: ethers.Contract;
  private _expectedHeld = BigNumber.from(0);

  constructor(
    public readonly channelId: string,
    private readonly _wallet: Wallet,
    private readonly _channel: Channel
  ) {
    this.nitroAdjudicator = new ethers.Contract(
      process.env.NITRO_ADJUDICATOR_ADDRESS || '0',
      ContractArtifacts.NitroAdjudicatorArtifact.abi,
      _wallet.getConstractSigner()
    );
    this.ethAssetHolder = new ethers.Contract(
      ETH_ASSET_HOLDER_ADDRESS,
      ContractArtifacts.EthAssetHolderArtifact.abi,
      _wallet.getConstractSigner()
    );
  }

  get other(): string {
    return this._channel.participants.find(p=>p!==this._wallet.getAddress());
  }

  async deposit(value: BigNumber) {
    //const value = ethers.utils.parseUnits(amount, "wei");
    const tx = this.ethAssetHolder.deposit(this._channelId, this._expectedHeld, value, {value});

    const { events } = await (await tx).wait();
    //const { destination, amountDeposited, destinationHoldings } = getDepositedEvent(events); 
    const depositedEvent = getDepositedEvent(events); 
    this._expectedHeld = depositedEvent.amountDeposited;
    console.log({depositedEvent});
    return depositedEvent;
  }

  //transfer value to other party
  async transfer(state: State, value: BigNumber): Promise<SignedState> {
    const amount = value.toHexString();
    const destination = convertAddressToBytes32(this.other);
    state.outcome.push({
      assetHolderAddress: ETH_ASSET_HOLDER_ADDRESS,
      allocationItems: [ { destination, amount }, ]
    });
    const signature = await this.signState(state);
    return { state, signature };
  }

  async requestConclude(state: State): Promise<SignedState> {
    state.isFinal = true;
    state.turnNum += 1;

    const signature = await this.signState(state);
    return { state, signature };
  }

  async conclude(state: State, signatures: Signature[]) {
    /* Generate a finalization proof */
    const fixedPart = getFixedPart(state);
    const appPartHash = hashAppPart(state);
    const outcomeBytes = encodeOutcome(state.outcome);
    const numStates = 1;
    const whoSignedWhat = new Array(signatures.length).fill(0);

    //console.log({ state, fixedPart, appPartHash, outcomeBytes, numStates, whoSignedWhat, signatures });
    const tx = this.nitroAdjudicator.concludePushOutcomeAndTransferAll(
      state.turnNum,
      fixedPart, appPartHash, outcomeBytes,
      numStates, whoSignedWhat, signatures
    );

    const {logs} = await (await tx).wait();
    const events = compileEventsFromLogs(logs, [ this.ethAssetHolder, this.nitroAdjudicator, ]);
    //console.log({events: JSON.stringify(events, null, 2)});
    return events;
  }

  private async signState(state: State) {
    const signer = this._wallet.getMessageSigner();
    return sign(signer, state);
  }
}

