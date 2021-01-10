import 'regenerator-runtime/runtime'
import Portis from '@portis/web3';
import Web3 from 'web3';

/* Import ethereum wallet utilities  */
import { ethers, utils, Signer, Wallet, BigNumber, Signature } from "ethers";
const { AddressZero, HashZero } = ethers.constants;

/* Import statechannels wallet utilities  */
import {
  ContractArtifacts,
  Channel, State, Outcome, AllocationAssetOutcome, SignedState,
   getDepositedEvent, signStates
} from "@statechannels/nitro-protocol";

import axios from "axios";

main();

async function main() {
  /* Set up an ethereum provider connected to our local blockchain */
  const portis = new Portis(process.env.DAPP_ADDRESS, process.env.DAPP_NETWORK);
  const web3 = new Web3(portis.provider);

  portis.onLogin(async(walletAddress, email, reputation) => {
    const provider = new ethers.providers.Web3Provider(portis.provider);
    const signer = provider.getSigner();

    const nitroAdjudicator = new ethers.Contract(
      process.env.NITRO_ADJUDICATOR_ADDRESS,
      ContractArtifacts.NitroAdjudicatorArtifact.abi,
      signer
    );

    const ETHAssetHolder = new ethers.Contract(
      process.env.ETH_ASSET_HOLDER_ADDRESS,
      ContractArtifacts.EthAssetHolderArtifact.abi,
      signer
    );

    const current: {state: State, expectedHeld: BigNumber} = {
      state:{
        turnNum: 0,
        isFinal: false,
        //@ts-ignore
        channel: {},
        outcome: [],
        appDefinition: AddressZero,
        appData: HashZero,
        challengeDuration: 86400, //one day
      },
      expectedHeld: BigNumber.from(0)
    };

    const signatures: Signature[] = [];

    const manager = {
      onDeposit: async function(channelId, wei) {
        const amount = ethers.utils.parseUnits(wei.toString(), "wei");
        const tx = ETHAssetHolder.deposit(channelId, current.expectedHeld, amount, {
          value: amount,
        });

        const { events } = await (await tx).wait();
        //const { destination, amountDeposited, destinationHoldings } = getDepositedEvent(events); 
        const depositedEvent = getDepositedEvent(events); 
        current.expectedHeld = depositedEvent.amountDeposited;
        console.log({depositedEvent});
        return depositedEvent;
      },

      onTransfer: async function(channel: Channel, wei: number) {
        //reference: https://ethereum.stackexchange.com/questions/72199/testing-sha256abi-encodepacked-argument
        const destination = Web3.utils.keccak256(channel.participants[1].substring(2));
        const amount = ethers.utils.parseUnits(wei.toString(), "wei");
        console.log({amount});
        const outcome: AllocationAssetOutcome = {
          assetHolderAddress: process.env.ETH_ASSET_HOLDER_ADDRESS,
          allocationItems: [ { destination, amount }, ]
        };

        //FIXME: too hacky
        const { state } = current;
        state.channel = channel;
        state.turnNum += 1;
        state.outcome.push(outcome);
        const signature = await sign(signer, state);

        signatures.push(signature);
        return { state, signature }

        //no checkpoint for now to save transaction fee
        /*
        const fixedPart = getFixedPart(state);
        const variableParts = getVariablePart(state);
        const isFinalCount = 0;
        const tx = nitroAdjudicator.checkpoint(
          fixedPart,
          state.turnNum,
          variableParts,
          isFinalCount,
          sigs,
          whoSignedWhat
        );
        await (await tx).wait();
        */
      },

      onConfirm: function({state, signature}: SignedState, outcome: Outcome) {
        //TODO: valid current state and newState
        state.outcome = outcome;
        current.state = state;
        signatures.push(signature);
      },
    };  //end manager

    await updateUI(walletAddress, manager);
  });
  portis.showPortis();
}


async function updateUI(address: string, manager: any) {
  document.querySelector("#participant1").innerHTML = address;

  show("#step1");
  await new Promise(resolv=>document.querySelector('#create').addEventListener("click", resolv));

  //create channel
  show("#step2");
  const { data } = await axios.post("/channel", { participant1: address, });
  const { channelId, channel } = data;
  const { chainId, participants } = channel;

  document.querySelector('#participant2').value = participants[1];
  document.querySelector('#channelId').value = channelId;

  //deposit to holdings
  document.querySelector('#btn_deposit').addEventListener("click", async() => {
    const deposit = parseInt(document.querySelector('#deposit').value);
    const { destination, amountDeposited, destinationHoldings:holdings } = await manager.onDeposit(channelId, deposit);
    document.querySelector('#holdings').value = holdings;
    show("#step3");
    show("#step4");
  });

  //transfer
  document.querySelector('#btn_transfer').addEventListener("click", async() => {
    const amount = parseInt(document.querySelector('#transfer').value);
    const {state, signature} = await manager.onTransfer(channel, amount);
    const { outcome, ...partialState } = state;
    const payload = { channelId, state: partialState, signature, outcome:outcome[outcome.length-1] };
    console.log({payload});
    const { data } = await axios.post("/transfer", payload);
    manager.onConfirm(data, outcome);

    const node = document.createElement("LI");                 // Create a <li> node
    const textnode = document.createTextNode(JSON.stringify(outcome[outcome.length-1]));         // Create a text node
    node.appendChild(textnode);                              // Append the text to <li>
    document.querySelector('#history').appendChild(node);
  });

  //conclude
  document.querySelector('#btn_conclude').addEventListener("click", async()=> {
    hide("#step1");
    hide("#step3");
    const { data } = await axios.post("/conclude", { channelId });
    //TODO: valid final state
    alert('Conclude');
  });

}


function show(selector: string){
  setDisplay(selector, "block");
}

function hide(selector: string){
  setDisplay(selector, "none");
}

function setDisplay(selector: string, display: string) {
  //@ts-ignore
  document.querySelector(selector).style.display = display;
}


async function sign(signer: Signer, state: State): Promise<Signature> {
  //@ts-ignore: for the 2nd parameter of signStates, only wallet.signMessage is needed
  const wallet = signer as Wallet;
  const [signature] = await signStates([state], [wallet], [0]);
  return signature;
}

