import Bundler from 'parcel-bundler';
import dotenv  from "dotenv";
import express from 'express';
import bodyParser from 'body-parser';
import Web3 from 'web3';

import { ethers, providers, Wallet, Signature } from "ethers";
import { Channel, State, SignedState, getChannelId, signStates,
  getFixedPart, getVariablePart, hashAppPart, hashOutcome, encodeOutcome,
  ContractArtifacts
} from "@statechannels/nitro-protocol";

dotenv.config();

main();

async function main() {
  let provider, signer;

  if (process.env.LOCAL_TEST) {
    provider = new ethers.providers.JsonRpcProvider( `http://localhost:${process.env.GANACHE_PORT}`);
    signer = provider.getSigner(0);
  }
  else {
    provider = new providers.InfuraProvider(process.env.DAPP_NETWORK, process.env.INFURA_API_KEY);
    signer = new Wallet(process.env.WALLET2_PRIVATE_KEY||'', provider);
  }

  const nitroAdjudicator = new ethers.Contract(
    process.env.NITRO_ADJUDICATOR_ADDRESS || '0',
    ContractArtifacts.NitroAdjudicatorArtifact.abi,
    signer
  );
  const ethAssetHolder = new ethers.Contract(
    process.env.ETH_ASSET_HOLDER_ADDRESS || '0',
    ContractArtifacts.EthAssetHolderArtifact.abi,
    signer
  );

  //keep SignedState in case for challenge
  const channels = new Map<string, SignedState>();

  const app = express();
  app.use(bodyParser.json());

  app.post('/state', function(req, res) {
    const { payer }= req.body;
    const chainId = process.env.DAPP_CHAIN_ID;
    if (!chainId) throw new Error('cannot get DAPP_CHAIN_ID from env');
    const channel = getChannel(payer, chainId);
    const channelId = getChannelId(channel);
    res.send({channelId, channel});
  });

  app.put('/state/:channelId', async function(req, res) {
    const { channelId } = req.params;
    const { state, signature } = req.body;

    const found = channels.get(channelId);
    if (found) {
      //TODO: validate state is a valid move of the oldState
    }
    else {
      //TODO: validate the first state
    }
    channels.set(channelId, {state, signature});
    console.log(state);

    const mysig = await sign(signer, state);

    if (state.isFinal) {
      await conclude(nitroAdjudicator, ethAssetHolder, state, [signature, mysig]);
    }

    res.send({signature: mysig});
  });

  app.get('/state/:channelId', function(req, res) {
    const { channelId } = req.params;
    const found = channels.get(channelId);
    if (!found) {
      return res.sendStatus(404);
    }

    res.send(found.state);
  });

  const bundler = new Bundler('./index.html');
  app.use(bundler.middleware());

  app.listen(Number(process.env.SERVER_PORT || 3000));
}


async function conclude(nitroAdjudicator: ethers.Contract, ethAssetHolder: ethers.Contract, state: State, signatures: Signature[]) {
  /* Generate a finalization proof */
  const fixedPart = getFixedPart(state);
  const appPartHash = hashAppPart(state);
  const outcomeBytes = encodeOutcome(state.outcome);
  const numStates = 1;
  const whoSignedWhat = new Array(signatures.length).fill(0);

  //console.log({ state, fixedPart, appPartHash, outcomeBytes, numStates, whoSignedWhat, signatures });
  const tx = nitroAdjudicator.concludePushOutcomeAndTransferAll(
    state.turnNum,
    fixedPart, appPartHash, outcomeBytes,
    numStates, whoSignedWhat, signatures
  );

  const {logs} = await (await tx).wait();
  const events = compileEventsFromLogs(logs, [ ethAssetHolder, nitroAdjudicator, ]);
  console.log({events: JSON.stringify(events, null, 2)});
}


function getChannel(payer: string, chainId: string): Channel {
    const receiver = process.env.WALLET2_ADDRESS;
    if (!receiver) throw new Error('cannot get WALLET2_ADDRESS from .env');
    return {
      participants: [ payer, receiver ],
      chainId,
      channelNonce: Math.floor(Math.random() * 100000) 
  };
}

async function sign(signer: Signer, state: State): Promise<Signature> {
  //@ts-ignore: for the 2nd parameter of signStates, only wallet.signMessage is needed
  const wallet = signer as Wallet;
  const [signature] = await signStates([state], [wallet], [0]);
  return signature;
}


function compileEventsFromLogs(logs: any[], contractsArray: ethers.Contract[]): Event[] {
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
