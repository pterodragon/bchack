import Bundler from 'parcel-bundler';
import dotenv  from "dotenv";
import express from 'express';
import bodyParser from 'body-parser';
import Web3 from 'web3';

import { ethers, providers, Signer, Wallet, Signature } from "ethers";
import { Channel, State, SignedState, getChannelId, signStates,
  getFixedPart, getVariablePart, hashAppPart, hashOutcome, encodeOutcome,
} from "@statechannels/nitro-protocol";
import {NonceManager} from '@ethersproject/experimental';

const WALLET1_PRIVATE_KEY = '78d01603751d0ecd4e8138ba897a687a014c4672a2198e845470ac6c581b8e1d';
const FINAL_STATE = {
  "turnNum": 3,
  "isFinal": true,
  "channel": {
    "participants": [
      "0x8e96ccd46005f905ca1534cea49536afaf2f9986",
      "0x7AAC586C18603424Def6cadC0070Ae3274698F86"
    ],
    "chainId": "0x5",
    "channelNonce": 0
  },
  "outcome": [
    {
      "assetHolderAddress": "0x0c21F09C4fA08D521091F8d22F79f15E52DDd610",
      "allocationItems": [
        {
          "destination": "0xd693442490d7fa3f6de8d04ca2bc8d05fd98403f97ce5a5378b535c2a21ab18c",
          "amount": "2"
        }
      ]
    }
  ],
  "appDefinition": "0x0000000000000000000000000000000000000000",
  "appData": "0x0000000000000000000000000000000000000000000000000000000000000000",
  "challengeDuration": 86400
};

dotenv.config();
main();

async function main() {
  await signState(WALLET1_PRIVATE_KEY, FINAL_STATE);
  await signState(process.env.WALLET2_PRIVATE_KEY||'', FINAL_STATE);
}

async function signState(privatekey: string, state: State) {
  const provider = new providers.InfuraProvider(process.env.DAPP_NETWORK, process.env.INFURA_API_KEY);
  //const signer = new NonceManager(new Wallet(privatekey, provider));
  const signer = new Wallet(privatekey, provider);
  const sig = await sign(signer, state);
  console.log(sig);
}


async function sign(signer: Signer|Wallet, state: State): Promise<Signature> {
  //@ts-ignore: for the 2nd parameter of signStates, only wallet.signMessage is needed
  const wallet = signer as Wallet;
  const [signature] = await signStates([state], [wallet], [0]);
  return signature;
}

