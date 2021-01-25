import Portis from '@portis/web3';
import Web3 from 'web3';
import {EventEmitter} from "events";

import { BigNumber, Contract, ethers, Signature, Signer, Wallet } from "ethers";
const {parseUnits} = ethers.utils;

import {AppData, AppDefinition} from "./definition";

import {
  Channel,
  State,
  getDepositedEvent,
  getFixedPart,
  getVariablePart,
  isAllocationOutcome,
  signStates,
  Signatures,
  SignedState,
  isGuaranteeOutcome,
  AllocationItem,
  hashOutcome,
  DepositedEvent,
  hashAppPart,
  getChannelId,
  hashState,
  encodeOutcome,
} from "@statechannels/nitro-protocol";

import { sign, signChallengeMessage } from '@statechannels/nitro-protocol/lib/src/signatures';
import { hexZeroPad, id, verifyMessage } from 'ethers/lib/utils';
import { hashChallengeMessage } from '@statechannels/nitro-protocol/lib/src/contract/challenge';
import { PortisEthSigner } from './signer';

const portis = new Portis('95629333-653a-4532-af54-ef64b586d2a5', 'goerli');
const web3 = new Web3(portis.provider);

const provider = new ethers.providers.Web3Provider(portis.provider);
provider.getSigner(0);

export interface WorkflowFundChannel{
  emit(event: 'fundAgreed', workflowFundChannel: WorkflowFundChannel, amounts: ethers.BigNumber[]): boolean;
  emit(event: 'depositReady', workflowFundChannel: WorkflowFundChannel): boolean;
  emit(event: 'fundDeposed', workflowFundChannel: WorkflowFundChannel, state:SignedState, ev?: DepositedEvent): boolean;
  emit(event: 'fundingCompleted', channel: FullConsensusChannel, amounts: ethers.BigNumber[]): boolean;
  emit(event: 'fundingFailed', workflowFundChannel: WorkflowFundChannel, failedAt: 'prefund' | 'postfund', error: Error): boolean;

  on(event: 'fundAgreed', listener: (workflowFundChannel: WorkflowFundChannel, amounts: ethers.BigNumber[])=>void): this;
  on(event: 'depositReady', listener: (WorkflowFundChannel: WorkflowFundChannel)=>void): this;
  on(event: 'fundDeposed', listener: (workflowFundChannel: WorkflowFundChannel, state:SignedState, ev?: DepositedEvent)=>void): this;
  on(event: 'fundingCompleted', listener: (channel: FullConsensusChannel, amounts: ethers.BigNumber[])=>void) :this;
  on(event: 'fundingFailed', listener: (workflowFundChannel: WorkflowFundChannel, failedAt: 'prefund' | 'postfund', error: Error)=>void): this;
}
export class WorkflowFundChannel extends EventEmitter{
  public isFunded: boolean;
  private isFundingAgreed?: boolean;

  public readonly channel:FullConsensusChannel;
  private roundInited: number;
  private myAmount:ethers.BigNumber;
  private allocations: ethers.BigNumber[];
  private expectedDepositTurn: number;
  private expectedHeld: ethers.BigNumber;

  constructor(channel: FullConsensusChannel){
    super();

    this.isFunded = false;
    this.roundInited = -1;
    this.channel = channel;
    this.myAmount = ethers.constants.Zero;
    this.allocations = [];
    this.expectedDepositTurn = -1;
    this.expectedHeld = ethers.constants.Zero;
  }

  private onConsensed = ((channel: FullConsensusChannel, outcome: ethers.BigNumber[])=>{
    if(!channel.statesConsensed) { return; }
    const roundConsensed = Math.floor(channel.statesConsensed[0].state.turnNum / channel.participants.length);
    if(roundConsensed == this.roundInited){
      this.isFundingAgreed = true;
      this.emit('fundAgreed', this, this.allocations);
    }else if(roundConsensed > this.roundInited){
      this.isFunded = true;
      this.channel.removeListener('consensed', this.onConsensed);
      this.channel.removeListener('diverged', this.onDiverged);
      this.emit('fundingCompleted', this.channel, this.allocations);
    }
  }).bind(this)


  private onDiverged = ((channel: FullConsensusChannel, proposed: {outcome: ethers.BigNumber[], by: number[]},
  diverged: {outcome?: ethers.BigNumber[], by: number[]}[]):void =>{
    this.isFundingAgreed = false;
    this.emit('fundingFailed', this, channel.statesConsensed? 'postfund':'prefund', new Error("Diverged outcome"));  
  }).bind(this)

  private onNewState = ((channel: FullConsensusChannel, signedState: SignedState)=>{
    if(this.channel.statesConsensed){
      //Check if the state agree to previously consensed outcome
      const expectedState = this.channel.statesConsensed[this.channel.myTurn].state;
      if(expectedState){
        //Assuming the the previous participant does his check
        if(hashOutcome(expectedState.outcome)==hashOutcome(signedState.state.outcome)){
          if(channel.myTurn == 0 || channel.statesReaching[channel.myTurn - 1] != undefined){
            this.channel.removeListener('state', this.onNewState);
            this.emit('depositReady', this);
          }
        }else{
          //TODO: fill diverged info if needed
          this.onDiverged(this.channel, {outcome: this.allocations, by:[this.channel.myTurn]}, [{by:[signedState.state.turnNum%this.channel.participants.length]}]);
        }
      }else{
        this.emit("fundingFailed", this, 'postfund', new Error("Missing expected state in post fund stage"));
      }
    }
  }).bind(this)

  public async propose(amounts: ethers.BigNumber[]): Promise<SignedState>{
    if(this.isFunded || this.roundInited >= 0){
      throw Error("Not in pre fund stage"); //TODO: Can add fund after the channel is up?
    }
    this.channel.on('consensed', this.onConsensed);
    this.channel.on('diverged', this.onDiverged);
    this.channel.on('state', this.onNewState);

    this.roundInited = this.channel.currentRound;
    this.expectedHeld = amounts.reduce((sum, amount, i) => (i < this.channel.myTurn? amount.add(sum) : sum), ethers.constants.Zero);
    this.allocations = amounts;

    const signed = await this.channel.propose(amounts);
    return signed;
  };

  public canDepose(): boolean{
    const myTurn = this.channel.myTurn;
    if(this.isFundingAgreed && !this.isFunded){
      if(myTurn > 0){
        return this.channel.statesReaching[myTurn-1]? true:false;
      }
      return true;
    }
    return false;
  }

  public async deposit(): Promise<SignedState>{
    if(!this.canDepose() || this.channel.statesConsensed == undefined){
      throw Error("Not ready for deposit.");
    }

    if(!this.isFundingAgreed){
      throw Error("Outcome is not agreed on all party");
    }
    const amount = this.allocations[this.channel.myTurn];
    const destination = ethers.utils.hexZeroPad(this.channel.channelId, 32);
    const expectedHeld = this.expectedHeld; 

    let depositedEvent;
    const amountNumber = amount.toString();
    if(amountNumber > '0'){
      const tx = FullConsensusChannel.EthAssetHolder.deposit(destination, expectedHeld, amount, {
        value: amount
      });

      const { events } = await (await tx).wait();
      depositedEvent = getDepositedEvent(events);
    } 

    const signed = await this.channel.propose(this.allocations);
    this.emit('fundDeposed', this, signed, depositedEvent);

    return signed;
  }

}

export interface Transaction{
  payee: number;
  payer: number;
  amount: string | ethers.BigNumber;
  unit?: string;
}

export class InSufficientFundError extends Error{
  constructor(...args:any){
    super(...args);
  }
}
export class TransitionError extends Error{
  constructor(...args: any){
    super(...args);
  }
}

export interface FullConsensusChannel{
  emit(event: 'consensed', channel: FullConsensusChannel, outcome: ethers.BigNumber[]): boolean;
  emit(event: 'diverged', channel: FullConsensusChannel, proposed: {outcome: ethers.BigNumber[], by: number[]},
    diverged: {outcome?: ethers.BigNumber[], by: number[]}[]): boolean;
  emit(event: 'state', channel: FullConsensusChannel, newState: SignedState): boolean;
  emit(event: 'closed', channel: FullConsensusChannel, outcome: ethers.BigNumber[]): boolean;

  on(event: 'consensed', listener: (channel: FullConsensusChannel, outcome: ethers.BigNumber[])=>void): this;
  on(event: 'diverged', listener: (channel: FullConsensusChannel, proposed: {outcome: ethers.BigNumber[], by: number[]},
    diverged: {outcome?: ethers.BigNumber[], by: number[]}[])=>void): this;
  on(event: 'state', listener: (channel: FullConsensusChannel, newState: SignedState)=>void): this;
  on(event: 'closed', listener: (channel: FullConsensusChannel, outcome: ethers.BigNumber[])=>void): this;
}

/**
 * A full consensus channel is that one will only proceed when the current state is signed by all parties.
 * This is in contrast to a partially consensus channel that defines it own transition validation logic in adjudiciator,
 * to ensure an undefeatable outcome.
 * 
 * To prevent collison in turn num, all parties must agree to the same ordering of participants,
 * and sign the state with the turnNum where (turnNum % particiantNum) == the order of the signer in the list
 * 
 * Thus states with the same (roundNum = turnNum % particiant) form a round to reach a consense,
 * where it is fully consensed when the signed states in the same round agree to one outcome,
 * which will then be challenged by the first payee that gained the most amount of money in that turn,
 * to ensure the channel will not be concluded at a previously consensed state.
 * 
 * If there is divergent, the particiants shall reach a new consense in the next round.
 * 
 */
export class FullConsensusChannel extends EventEmitter{
  public static EthAssetHolder: Contract;
  public static NitroAdjudicator: Contract;

  public readonly myWallet: Wallet;
  public readonly myTurn: number;
  public readonly participants: string[];
  public readonly channelNonce: number;
  public readonly channelId: string

  public readonly stateChannel: Channel;
  public readonly challengeDuration: number;
  
  public statesConsensed?: SignedState[];
  public statesReaching: (SignedState | undefined)[];
  public currentRound: number;

  public funding?: WorkflowFundChannel;
  private isFinalizing: boolean;

  /**
   * 
   * @param myWallet Wallet to sign states
   * @param participants Address of participants. The order has to be pre-agreed
   * @param chainId 
   * @param channelNonce 
   * @param challengeDuration 
   */
  constructor(myWallet: Wallet,  participants: string[], chainId?: string, channelNonce?: number, challengeDuration?: number){
    super();
    chainId = chainId || "0x1";
    channelNonce = channelNonce || Date.now();
    this.channelNonce = channelNonce;
    this.myWallet = myWallet;
    this.participants = participants;
    this.myTurn = this.participants.findIndex(d=>d==myWallet.address);
    this.stateChannel = {chainId, channelNonce, participants};
    this.channelId = getChannelId(this.stateChannel);
    this.challengeDuration = challengeDuration || 3600;
    this.statesReaching = Array.from({length: this.participants.length});
    this.currentRound = 0;
    this.isFinalizing = false;
  }
  
  public async onStateReceived(signedState: SignedState, from: number){
    const numParticipants = this.participants.length;
    const roundReceived = Math.floor(signedState.state.turnNum / numParticipants);
    this.isFinalizing = signedState.state.isFinal ? true : this.isFinalizing;
    if(!this.isFinalizing && from != signedState.state.turnNum % numParticipants){
      throw new Error("Party "+from+" sent a state in wrong turn num: " + signedState.state.turnNum)
    }
    if(roundReceived < this.currentRound){
      console.log("(!!) Discarding old state received from " + from + " with turnNum: " + signedState.state.turnNum + ". Current round: " + this.currentRound);
      return;
    }

    if(roundReceived > this.currentRound){
      console.log("(!!) Fast forwarding to turnNum: " + signedState.state.turnNum + " from " + from +". Current round: " + this.currentRound);
      this.emit('diverged', this, {outcome: [], by :[]}, [{by:[from]}]);

      this.currentRound = roundReceived;
      this.statesReaching.forEach((v, i, arr)=>arr[i]=undefined);
    }
    this.statesReaching[from] = signedState;
    const expectedOutcome = this.statesReaching[this.myTurn]?.state.outcome;
    if(expectedOutcome && this.statesReaching.findIndex(s=>s===undefined) < 0){
      const expectedHash = hashOutcome(expectedOutcome);
      const asExpected = this.statesReaching.map(s=>(s? hashOutcome(s.state.outcome)==expectedHash : false));
      if(asExpected.find(e=>!e)){
        //Discard and proceed to next round
        const divergedStates = Array.from(this.statesReaching);
        this.currentRound++;
        this.statesReaching.forEach((v, i, arr)=>arr[i]=undefined);
        this.emitDivergedOutcome(asExpected, divergedStates);
      }else{
        const consensed:SignedState[] = [];
        this.statesReaching.forEach((state, i)=>{
          if(state) consensed[i]=state;
          else throw Error("Undefined state unexpected");
        });

        const lastConsensed = this.statesConsensed;
        this.statesConsensed = consensed;
        this.currentRound++;
        this.statesReaching.forEach((v, i, arr)=>arr[i]=undefined);
        this.emitConsensed();
        
        await this.challengeIfGained(lastConsensed, consensed);
      }
    }

    this.emit('state', this, signedState);
  }

  public beginFunding(): WorkflowFundChannel{
    this.funding = this.funding || new WorkflowFundChannel(this);
    return this.funding;
  }

  public async propose(amountsByParticipants: ethers.BigNumber[], isFinal?: boolean): Promise<SignedState>{
    this.isFinalizing = this.isFinalizing? true : (isFinal? true : false);
    
    const destinations = this.participants;
    const turnNum  = this.currentRound*this.participants.length + (this.isFinalizing?  0 : this.myTurn);
    const state: State = {
      appData: AppData,
      appDefinition: AppDefinition,
      challengeDuration: this.challengeDuration,
      channel: this.stateChannel,
      isFinal: this.isFinalizing,
      outcome: [{
        assetHolderAddress: FullConsensusChannel.EthAssetHolder.address,
        allocationItems: amountsByParticipants.map((amount, i):AllocationItem=>{
          return {destination: hexZeroPad(destinations[i], 32), amount: amount.toHexString()}
        })
      }],
      turnNum: turnNum,
    };

    const stateHash = ethers.utils.arrayify(hashState(state));
    const signature = ethers.utils.splitSignature(await this.myWallet.signMessage(stateHash));
    const signed: SignedState = {signature, state};

    await this.onStateReceived(signed, this.myTurn);
    return signed;
  }

  public async transfer(transactions: {payer:number, payee: number, amount: string | ethers.BigNumber, unit?:string}[]): Promise<SignedState>{
    if(this.funding?.isFunded){
      if(this.isFinalizing){
        throw new TransitionError("Channel is finalizing / finalized");
      }
      if(this.statesConsensed){
        const allocations = this.getAllocationsFrom(this.statesConsensed[this.myTurn].state);
        transactions.forEach(t=>{
          const amount = (typeof t.amount == "string")? parseUnits(t.amount, t.unit) : t.amount;
          allocations[t.payer] = allocations[t.payer].sub(amount);
          allocations[t.payee] = allocations[t.payee].add(amount);
        });
        allocations.forEach((a, i)=>{
          if(a.lt(ethers.constants.Zero)) throw new InSufficientFundError("Payer " + i + " don't have enough fund");
        });
        
        return await this.propose(allocations);
      }else throw new Error("Missing consensed state after channel is funded");

    }else throw new TransitionError("Channel is not funded");
    
  }

  public async finalize(): Promise<{state: SignedState, submitTo: number}>{
    if(this.statesConsensed){
      const allocations = this.getAllocationsFrom(this.statesConsensed[this.myTurn].state);
      const signed = await this.propose(allocations, true);

      let maxAllocation = ethers.constants.Zero;
      let maxAt = -1;
      allocations.forEach((a, i)=>{
        if(a.gt(maxAllocation)){
          maxAllocation = a;
          maxAt = i;
        }
      })

      if(maxAt == this.myTurn){
        this.on('consensed', async (channel, outcome)=>{
          const signedStates = channel.statesConsensed;
          if(signedStates){
            const state = signedStates[channel.myTurn].state;
            const largestTurnNum = state.turnNum;
            const numStates = 1;
            const fixedPart = getFixedPart(state);
            const appPartHash = hashAppPart(state);
            const outcomeBytes = encodeOutcome(state.outcome);
            const sigs = signedStates.map(signed=>signed.signature);
            const whoSignedWhat = Array.from({length:channel.participants.length}, ()=>0);

            await (
              await FullConsensusChannel.NitroAdjudicator.concludePushOutcomeAndTransferAll(
                largestTurnNum,
                fixedPart,
                appPartHash,
                outcomeBytes,
                numStates,
                whoSignedWhat,
                sigs
              )
            ).wait();

            channel.emit('closed', channel, allocations);
          }
        });
      }

      return {state: signed, submitTo: maxAt};
    } else throw new TransitionError("No consensed state to finalize")
    
  }

  public getParticipantIndex(particiant: string | {walletAddress?: string}): number{
    const wallet = (typeof particiant === "string")? particiant : particiant.walletAddress;
    return this.participants.findIndex(p=>p==particiant);
  }

  public getAllocationsFrom(state: State, sumWith?: ethers.BigNumber[]): ethers.BigNumber[]{
    const calcOutcome: (outcomes: ethers.BigNumber[], allocation: AllocationItem) => ethers.BigNumber[] = (outcomes, allocation)=>{
      const i = this.participants.findIndex(p=>hexZeroPad(p, 32)==allocation.destination);
      if(i>=0){
        outcomes[i] = outcomes[i].add(ethers.BigNumber.from({hex: allocation.amount, type:'BigNumber'})); //TODO: check unit in AllocationItem
      }
      return outcomes;
    }

    const allocations: ethers.BigNumber[] = sumWith || Array.from({length: this.participants.length}, ()=>ethers.constants.Zero);

    state.outcome.forEach(o=>{
      if(isAllocationOutcome(o)){
        o.allocationItems.reduce(calcOutcome, allocations);
      } else if(isGuaranteeOutcome(o)) {  //TODO: Calculating GuaranteeOutcome
        throw new Error("Calculating GuaranteeOutcome is not yet implemented");
      }
    })

    return allocations;
  }


  private async challengeIfGained(lastConsensed: SignedState[] | undefined, justConsensed: SignedState[]){
    let allocations: ethers.BigNumber[] = lastConsensed? this.getAllocationsFrom(lastConsensed[this.myTurn].state)
     : Array.from({length: this.participants.length}, ()=>ethers.constants.Zero);

    allocations.forEach((v, i, a)=>a[i]=v.mul(ethers.constants.NegativeOne));
    allocations = this.getAllocationsFrom(justConsensed[this.myTurn].state, allocations);

    let maxOutcome = ethers.constants.Zero;
    let maxAt = -1;
    allocations.forEach((v, i)=>{
      if(v.gt(maxOutcome)){
        maxOutcome = v;
        maxAt = i;
      }
    });
    
    if(this.myTurn != maxAt){
      return;
    }

    const variableParts = justConsensed.map((state)=>getVariablePart(state.state));
    const fixedPart = getFixedPart(justConsensed[0].state);
    const signatures: Signature[] = justConsensed.map((signedState)=>signedState.signature);
    //const challengeSignature = signChallengeMessage([justConsensed[this.myTurn]], this.myWallet.privateKey);
    const stateHash = ethers.utils.arrayify(hashChallengeMessage(justConsensed[justConsensed.length-1].state));
    const challengeSignature = ethers.utils.splitSignature(await this.myWallet.signMessage(stateHash));

    const isFinalCount = 0;
    const whoSignedWhat = Array.from({length: this.participants.length}, (v, i)=>i);

    try{
      await(
        await FullConsensusChannel.NitroAdjudicator.challenge(
          fixedPart,
          justConsensed[justConsensed.length-1].state.turnNum,
          variableParts,
          isFinalCount,
          signatures,
          whoSignedWhat,
          challengeSignature
        )
      ).wait()
    }catch(err){
      console.warn("Challenge failed:");
      console.warn(err);
    }
  }

  private emitConsensed(): void{
    if(this.statesConsensed){
      const expected = this.statesConsensed[this.myTurn]?.state;
      const allocations = this.getAllocationsFrom(expected);

      this.emit('consensed', this, allocations);
    }
  }

  private emitDivergedOutcome(asExpected: boolean[], divergedStates: (SignedState | undefined)[]): void{
    const expected = divergedStates[this.myTurn]?.state.outcome[0]; //TODO: Support multiple outcomes
    let proposed: ethers.BigNumber[] =[];
    if(expected && isAllocationOutcome(expected)){  
      //TODO: Support multiple outcomes
      proposed = expected.allocationItems.reduce((o, a)=>{o[this.participants.findIndex(p=>p==a.destination)]=parseUnits(a.amount, "wei"); return o;}, proposed)
    } //TODO: Support Guarantee outcomes
    let proposedby: number[] = [];
    proposedby = asExpected.reduce((by, e, i)=>{
        if(e) by.concat(i);
        return by;
      }, proposedby);
    let diverged: {outcome?: ethers.BigNumber[], by: number[]}[] = [];
    diverged = asExpected.reduce((diverged, e, i)=>{
      if(!e){
        let outcome: ethers.BigNumber[] = [];
        const divergedOutcome = this.statesReaching[i]?.state.outcome[0]; //TODO: Support multiple outcomes
        if(!divergedOutcome){
          diverged.concat({outcome: undefined, by: [i]});
        }else if(isAllocationOutcome(divergedOutcome)){
          outcome = divergedOutcome.allocationItems.reduce((o, a)=>{o[this.participants.findIndex(p=>p==a.destination)]=parseUnits(a.amount, "wei"); return o;}, outcome);
          diverged.concat({outcome: outcome, by: [i]}); //TODO: merge same diverged outcome
        }//TODO: Support Guarantee Outcome
      }
      return diverged;
    }, diverged);
    this.emit('diverged', this, {outcome: proposed, by: proposedby}, diverged);
  }
}