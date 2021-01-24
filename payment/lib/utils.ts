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
    turnNum: 0,
    isFinal: false,
    channel,
    outcome: [],
    appDefinition: AddressZero,
    appData: HashZero,
    challengeDuration
  };
}


class OutcomesMap extends Map<string, Map<string, BigNumber>> {
  add(assetHolderAddress: string, destination: string, amount: any) {
    let map = super.get(assetHolderAddress);
    if (!map) {
      map = new Map();
      super.set(assetHolderAddress, map);
    }
    const value = BigNumber.from(amount);
    let balance = map.get(destination);
    map.set(destination, balance ? balance.add(value) : value);
    return this;
  }

  sub(assetHolderAddress: string, destination: string, amount: any) {
    let map = super.get(assetHolderAddress);
    if (!map) {
      map = new Map();
      super.set(assetHolderAddress, map);
    }
    const value = BigNumber.from(amount);
    let balance = map.get(destination);
    map.set(destination, balance ? balance.sub(value) : value.mul(BigNumber.from(-1)));
    return this;
  }

  toOutcome(): AllocationAssetOutcome[] {
    const ret: AllocationAssetOutcome[] = [];
    for (const [assetHolderAddress, m] of this) {
      const allocationItems = Array.from(m).map(([destination, amount])=>({destination, amount: amount.toHexString()}))
      ret.push({assetHolderAddress, allocationItems});
    }
    return ret;
  }
};

export function outcomesToMap(outcomes: AllocationAssetOutcome[]): OutcomesMap {
  return outcomes.reduce((ret, {assetHolderAddress,allocationItems}) => {
    allocationItems.forEach(({destination, amount}) =>
      ret.add(assetHolderAddress, destination, amount)
    );
    return ret;
  }, new OutcomesMap() );
}

