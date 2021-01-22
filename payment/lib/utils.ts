import { Signature, BigNumber } from "ethers";
import { ethers, Signer } from "ethers"
import { State, signStates, Channel } from "@statechannels/nitro-protocol";
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
