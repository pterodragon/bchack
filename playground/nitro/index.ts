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

dotenv.config();

main();

async function main() {
  const provider = new providers.InfuraProvider(process.env.DAPP_NETWORK, process.env.INFURA_API_KEY);
  const signer = new NonceManager(new Wallet(process.env.WALLET2_PRIVATE_KEY||'', provider));
  const channels = new Map<string, [State, Signature[]]>();

  const {
    NitroAdjudicatorArtifact,
  } = require("@statechannels/nitro-protocol").ContractArtifacts;
  const nitroAdjudicator = new ethers.Contract(
    process.env.NITRO_ADJUDICATOR_ADDRESS || '0',
    NitroAdjudicatorArtifact.abi,
    signer
  );
  //console.log('NitroAdjudicator', NitroAdjudicator);

  const bundler = new Bundler('./index.html');
  const app = express();
  app.use(bodyParser.json());

  app.post('/channel', function(req, res) {
    const { participant1 }= req.body;
    //const chainId = Web3.utils.randomHex(32);
    const chainId = process.env.DAPP_CHAIN_ID;
    if (!chainId) throw new Error('cannot get DAPP_CHAIN_ID from env');
    const channel = getChannel(participant1, chainId);
    const channelId = getChannelId(channel);
    res.send({channelId, channel});
  });

  app.post('/transfer', async function(req, res) {
    const { channelId, state, signature } = req.body;
    const found = channels.get(channelId);
    let signatures: Signature[] = [];
    if (found) {
      //TODO: validate state is a valid move of the oldState
      signatures = found[1];
    }
    else {
      //TODO: validate the first state
    }

    state.turnNum += 1;
    const nextSig = await sign(signer, state);
    signatures = [...signatures, signature, nextSig];
    console.log(state);
    channels.set(channelId, [state, signatures]);
    res.send({state, signature: nextSig});
  });

  app.post('/conclude', async function(req, res) {
    const { channelId } = req.body;
    const data = channels.get(channelId);
    if (!data) {
      throw new Error(`channel ${channelId} not found for conclude`);
    }
    const [ state, signatures ] = data;

    /* Generate a finalization proof */
    state.turnNum += 1;
    state.isFinal = true;
    const signature = await sign(signer, state);
    signatures.push(signature);
    console.log(state);

    const fixedPart = getFixedPart(state);
    console.log({fixedPart});
    const appPartHash = hashAppPart(state);
    const outcomeBytes = encodeOutcome(state.outcome);
    const numStates = signatures.length;
    const whoSignedWhat = Array.from(Array(numStates).keys()).map(i=>i&1);

    const tx = nitroAdjudicator.concludePushOutcomeAndTransferAll(
      state.turnNum,
      fixedPart, appPartHash, outcomeBytes,
      numStates, whoSignedWhat, signatures
    );
    await (await tx).wait();
    res.send({state, signature});
  });

  app.use(bundler.middleware());
  app.listen(3000);

}


function getChannel(participant1: string, chainId: string): Channel {
    const participant2 = process.env.WALLET2_ADDRESS;
    if (!participant2) throw new Error('cannot get WALLET2_ADDRESS from .env');
    return {
      participants: [ participant1, participant2 ],
      chainId,
      channelNonce: 0,
  };
}

async function sign(signer: Signer, state: State): Promise<Signature> {
  //@ts-ignore: for the 2nd parameter of signStates, only wallet.signMessage is needed
  const wallet = signer as Wallet;
  const [signature] = await signStates([state], [wallet], [0]);
  return signature;
}

