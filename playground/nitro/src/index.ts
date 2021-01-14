import 'regenerator-runtime/runtime'
import Portis from '@portis/web3';
import Web3 from 'web3';

/* Import ethereum wallet utilities  */
import { ethers, utils, Signer, Wallet, BigNumber, Signature } from "ethers";
import { PortisEthSigner } from "./signer";
const { AddressZero, HashZero } = ethers.constants;

/* Import statechannels wallet utilities  */
import {
  ContractArtifacts,
  Channel, State, Outcome, AllocationAssetOutcome, SignedState,
  getDepositedEvent, signStates,
  convertAddressToBytes32,
} from "@statechannels/nitro-protocol";

import axios from "axios";

main();


async function main() {
  /* Set up an ethereum provider connected to our local blockchain */
  const portis = new Portis(process.env.DAPP_ADDRESS, process.env.DAPP_NETWORK);
  const web3 = new Web3(portis.provider);
  const onLogin = (csigner, signer) => async function(walletAddress, email, reputation) {

    const nitroAdjudicator = new ethers.Contract(
      process.env.NITRO_ADJUDICATOR_ADDRESS,
      ContractArtifacts.NitroAdjudicatorArtifact.abi,
      csigner
    );

    const ethAssetHolder = new ethers.Contract(
      process.env.ETH_ASSET_HOLDER_ADDRESS,
      ContractArtifacts.EthAssetHolderArtifact.abi,
      csigner
    );

    const session: {state: State, expectedHeld: BigNumber, signature: Signature} = {
      state:{
        turnNum: 0,
        isFinal: false,
        //@ts-ignore
        channel: {},
        outcome: [],
        appDefinition: AddressZero,
        appData: HashZero,
        //challengeDuration: 86400, //one day
        challengeDuration: 10,
      },

      expectedHeld: BigNumber.from(0),

      //@ts-ignore
      //latest signature from others
      signature: undefined
    };


    const controller = {
      onCreateChannel: async function(channelId: string, channel: Channel) {
        const { state } = session;
        state.channel = channel;

        //reference: https://ethereum.stackexchange.com/questions/72199/testing-sha256abi-encodepacked-argument
        //const destination = Web3.utils.keccak256(channel.participants[1].substring(2));
        const destination = convertAddressToBytes32(channel.participants[1]);
        const amount = ethers.utils.parseUnits("0", "gwei").toHexString();
        const outcome: AllocationAssetOutcome = {
          assetHolderAddress: process.env.ETH_ASSET_HOLDER_ADDRESS,
          allocationItems: [ { destination, amount }, ]
        };
        state.outcome.push(outcome);
      },

      onDeposit: async function(channelId: string, value: string) {
        const amount = ethers.utils.parseUnits(value, "gwei");
        console.log(channelId, session.expectedHeld, amount, { value: amount });
        const tx = ethAssetHolder.deposit(channelId, session.expectedHeld, amount, { value: amount });

        try {
          const { events } = await (await tx).wait();
          //const { destination, amountDeposited, destinationHoldings } = getDepositedEvent(events); 
          const depositedEvent = getDepositedEvent(events); 
          session.expectedHeld = depositedEvent.amountDeposited;
          console.log({depositedEvent});
          return depositedEvent;
        } catch(err) {
          console.error(err);
          return {destinationHoldings: session.expectedHeld};
        }
      },

      onTransfer: async function(channel: Channel, value: string) {
        const { state } = session;

        const amount:BigNumber = ethers.utils.parseUnits(value, "gwei");
        const allocation = (state.outcome[0] as AllocationAssetOutcome).allocationItems[0];
        allocation.amount = BigNumber.from(allocation.amount).add(amount).toHexString();

        state.turnNum += 1;
        const signature = await sign(signer, state);
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

      onConfirm: function({signature}: {signature: Signature}) {
        //TODO: valid receiver's signature
        session.signature = signature;
      },

      onConclude: async function() {
        const { state } = session;
        state.isFinal = true;
        state.turnNum += 1;
        const signature = await sign(signer, state);
        return { state, signature }
      },
    };  //end controller

    await updateUI(walletAddress, controller);
  };

  if (process.env.LOCAL_TEST) {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const csigner = provider.getSigner();
    const signer = csigner;
    await onLogin(csigner, signer)(
      process.env.WALLET1_ADDRESS,
      'cornsmeetup@gmail.com',
      1
    );
  }
  else {
    const provider = new ethers.providers.Web3Provider(portis.provider);
    const csigner = provider.getSigner();
    const signer = new PortisEthSigner(csigner);
    portis.onLogin(onLogin(csigner, signer));
    portis.showPortis();
  }
}


async function updateUI(address: string, controller: any) {
  document.querySelector("#payer").innerHTML = address;

  show("#step1");
  await new Promise(resolv=>document.querySelector('#create').addEventListener("click", resolv));

  //create channel
  show("#step2");
  const { data } = await axios.post("/state", { payer: address, });
  const { channelId, channel } = data;
  const { chainId, participants } = channel;
  controller.onCreateChannel(channelId, channel);

  document.querySelector('#receiver').value = participants[1];
  document.querySelector('#channelId').value = channelId;

  //deposit to holdings
  document.querySelector('#btn_deposit').addEventListener("click", async() => {
    const { value } = document.querySelector('#deposit');
    const { destinationHoldings } = await controller.onDeposit(channelId, value);
    document.querySelector('#holdings').value = destinationHoldings;
    show("#step3");
    show("#step4");
  });

  //transfer
  document.querySelector('#btn_transfer').addEventListener("click", async() => {
    const { value } = document.querySelector('#transfer');
    const {state, signature} = await controller.onTransfer(channel, value);
    console.log(state);
    const { data } = await axios.put(`/state/${channelId}`, { state, signature });
    controller.onConfirm(data);

    const li = document.createElement("LI");                 // Create a <li> node
    const pre = document.createElement("PRE");
    const textnode = document.createTextNode(JSON.stringify({
      outcome: state.outcome[0], 
      signature1: signature,
      signature2: data.signature
    }, null, 2));         // Create a text node
    pre.appendChild(textnode);
    li.appendChild(pre);                              // Append the text to <li>
    document.querySelector('#history').appendChild(li);
  });

  //conclude
  document.querySelector('#btn_conclude').addEventListener("click", async()=> {
    hide("#step1");
    hide("#step3");
    const signed = await controller.onConclude();
    const { data } = await axios.put(`/state/${channelId}`, signed);
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

