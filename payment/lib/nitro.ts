import { Signature, BigNumber } from "ethers";
import { ethers, Signer } from "ethers"
import { sign, outcomesToMap, compileEventsFromLogs } from './utils';
import {
  State, Outcome, SignedState,
  AllocationAssetOutcome,
  getDepositedEvent,
  getFixedPart, getVariablePart, hashAppPart, encodeOutcome,
  convertAddressToBytes32
} from "@statechannels/nitro-protocol";
import createDebug from 'debug';

const log = createDebug('py.nitro');

/**
 * helper functions and contants on using nitro protocol
 */
export const ETH_ASSET_HOLDER_ADDRESS = process.env.ETH_ASSET_HOLDER_ADDRESS || '';
export const NITRO_ADJUDICATOR_ADDRESS = process.env.NITRO_ADJUDICATOR_ADDRESS || '';

log({ETH_ASSET_HOLDER_ADDRESS, NITRO_ADJUDICATOR_ADDRESS});

export async function deposit(ethAssetHolder: ethers.Contract, channelId: string, expectedHeld: BigNumber, value: BigNumber) {
  //const value = ethers.utils.parseUnits(amount, "wei");
  const tx = ethAssetHolder.deposit(channelId, expectedHeld, value, {value});
  const ret = await (await tx).wait();
  //const { destination, amountDeposited, destinationHoldings } = getDepositedEvent(events); 
  try {
    const depositedEvent = getDepositedEvent(ret.events); 
    log({depositedEvent});
    return depositedEvent;
  } catch(err){
    log(err);
    return;
  }
}

export function add(
  state: State,
  address: string,
  value: BigNumber): State
{
  const amount = value.toHexString();
  state = { ...state, outcome: outcomesToMap(state.outcome as AllocationAssetOutcome[])
                  .add(ETH_ASSET_HOLDER_ADDRESS, convertAddressToBytes32(address), amount)
                  .toOutcome()
  };
  
  return state;
}

export function sub(
  state: State,
  address: string,
  value: BigNumber): State
{
  const amount = value.toHexString();
  state = { ...state, outcome: outcomesToMap(state.outcome as AllocationAssetOutcome[])
                  .sub(ETH_ASSET_HOLDER_ADDRESS, convertAddressToBytes32(address), amount)
                  .toOutcome()
  };

  return state;
}


export async function conclude(nitroAdjudicator: ethers.Contract, state: State, signatures: Signature[]) {
  /* Generate a finalization proof */
  const fixedPart = getFixedPart(state);
  const appPartHash = hashAppPart(state);
  const outcomeBytes = encodeOutcome(state.outcome);
  const numStates = 1;
  const whoSignedWhat = new Array(signatures.length).fill(0);

  log({ turnNum: state.turnNum, fixedPart, appPartHash, outcomeBytes, numStates, whoSignedWhat, signatures });
  const tx = nitroAdjudicator.concludePushOutcomeAndTransferAll(
    state.turnNum,
    fixedPart, appPartHash, outcomeBytes,
    numStates, whoSignedWhat, signatures
  );

  return await (await tx).wait();
}

export function explainConclusion(result:any, contracts: ethers.Contract[]) {
  const {logs} = result;
  const events = compileEventsFromLogs(logs, contracts);
  return events;
}

