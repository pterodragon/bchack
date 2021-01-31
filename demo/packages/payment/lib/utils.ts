import { Signature, BigNumber } from "ethers";
import { ethers, Signer } from "ethers"
import { 
  State, signStates, Channel,
  AllocationAssetOutcome, AllocationItem,
} from "@statechannels/nitro-protocol";
const { AddressZero, HashZero } = ethers.constants;

export async function sign(signer: Signer, state: State): Promise<Signature> {
  const wallet = signer as ethers.Wallet;
  //@ts-ignore: for the 2nd parameter of signStates, only wallet.signMessage is needed
  const [signature] = await signStates([state], [wallet], [0]);
  return signature;
}

export function compileEventsFromLogs(logs: any[], contractsArray: ethers.Contract[]): Event[] {
  const events = [];
  logs.forEach(log => {
    contractsArray.forEach(contract => {
      if (log.address === contract.address) {
        //@ts-ignore
        events.push({...contract.interface.parseLog(log), contract: log.address});
      }
    });
  });
  return events;
}

export function createChannel(chainId: string, participants: string[]): Channel {
  return {
    participants,
    chainId,
    channelNonce: Math.floor(Math.random() * 100000) 
  };
}

export function createState(channel: Channel, challengeDuration=10): State {
  return {
    turnNum: 1,
    isFinal: false,
    channel,
    outcome: [],
    appDefinition: AddressZero,
    appData: HashZero,
    challengeDuration
  };
}


class OutcomesMap extends Map<string, Map<string, BigNumber>> {
  add(assetHolderAddress: string, destination: string, value: BigNumber) {
    let map = super.get(assetHolderAddress);
    if (!map) {
      map = new Map();
      super.set(assetHolderAddress, map);
    }
    const balance = map.get(destination);
    map.set(destination, balance ? balance.add(value) : value);
    return this;
  }

  sub(assetHolderAddress: string, destination: string, value: BigNumber) {
    let map = super.get(assetHolderAddress);
    if (!map) {
      map = new Map();
      super.set(assetHolderAddress, map);
    }
    const balance = map.get(destination);
    map.set(destination, balance ? balance.sub(value) : value.mul(-1));
    return this;
  }

  toOutcome(): AllocationAssetOutcome[] {
    const ret: AllocationAssetOutcome[] = [];
    for (const [assetHolderAddress, m] of this) {
      const allocationItems = Array.from(m).map(([destination, amount])=>({destination, amount: amount.toHexString()}))
      ret.push({assetHolderAddress, allocationItems});
    }
    //sort the results to make sure state.outcome in all parties are sync
    ret.forEach((allocationOutcome)=>allocationOutcome.allocationItems.sort((a, b)=>a.destination.localeCompare(b.destination)));
    return ret.sort((a,b)=>a.assetHolderAddress.localeCompare(b.assetHolderAddress));
  }
};

export function outcomesToMap(outcomes: AllocationAssetOutcome[]): OutcomesMap {
  const out = new OutcomesMap();
  for (const {assetHolderAddress,allocationItems} of outcomes) {
    for (const {destination, amount} of allocationItems) {
      out.add(assetHolderAddress, destination, BigNumber.from(amount));
    }
  }
  return out;
}

