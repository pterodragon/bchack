import 'regenerator-runtime/runtime'
import Portis from '@portis/web3';
import Web3 from 'web3';

/* Import ethereum wallet utilities  */
import { ethers } from "ethers";

/* Import statechannels wallet utilities  */
import { Channel, State, getVariablePart } from "@statechannels/nitro-protocol";

import { deploy } from "../deployment/deploy";

const network = 'ropsten';

/* Set up an ethereum provider connected to our local blockchain */
/*
const portis = new Portis(process.env.DAPP_ADDRESS, network);
portis.showPortis();

portis.onLogin((walletAddress, email, reputation) => {
//  const provider = new ethers.providers.Web3Provider(portis.provider);
  const provider = ethers.getDefaultProvider(network);
  const { NitroAdjudicatorArtifact, } = require("@statechannels/nitro-protocol").ContractArtifacts;
  const NitroAdjudicator = new ethers.Contract(
    process.env.NITRO_ADJUDICATOR_ADDRESS,
    NitroAdjudicatorArtifact.abi,
    provider.getSigner()
  );
});
*/
async function main() {
  const deployed = await deploy(network, process.env.WALLET_PRIVATE_KEY, process.env.INFURA_API_KEY);
  console.log('deployed', deployed);
  const provider = new ethers.providers.Web3Provider(web3.currentProvider);
  const { NitroAdjudicatorArtifact, } = require("@statechannels/nitro-protocol").ContractArtifacts;
  const NitroAdjudicator = new ethers.Contract(
    deployed.NITRO_ADJUDICATOR_ADDRESS,
    NitroAdjudicatorArtifact.abi,
    provider.getSigner(0)
  );
  console.log('NitroAdjudicator', NitroAdjudicator);
}
main();

async function validTransition(address: string, contract: ethers.Contract) {
  const participants = [
    address,
  ];

  const channel: Channel = {
    participants,
    chainId: "0x3",
    channelNonce: 0,
  };

  const fromState: State = {
    channel,
    outcome: [],
    turnNum: 0,
    isFinal: false,
    challengeDuration: 0x0,
    appDefinition: process.env.DAPP_ADDRESS, appData: "0x00",
  };

  /* Construct another state */
  const toState: State = { ...fromState, turnNum: 1};

  await contract.validTransition(
    channel.participants.length,
    [fromState.isFinal, toState.isFinal],
    [getVariablePart(fromState), getVariablePart(toState)],
    toState.turnNum, // We only get to submit one turn number so cannot check validity
    // If incorrect, transactions will fail during a check on state signatures
    fromState.appDefinition
  );
}

