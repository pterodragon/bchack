import 'regenerator-runtime/runtime'
import { ethers, providers, Signer, Wallet, Signature } from "ethers";
import { Channel, State, SignedState, getChannelId, signStates,
} from "@statechannels/nitro-protocol";

import Portis from '@portis/web3';
import { PortisEthSigner } from "./signer";

require('dotenv').config()


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

main();

async function main() {
  const portis = new Portis(process.env.DAPP_ADDRESS, process.env.DAPP_NETWORK);
  const web3 = new Web3(portis.provider);

  portis.onLogin(async(walletAddress, email, reputation) => {
    const provider = new ethers.providers.Web3Provider(portis.provider);
    const signer = new PortisEthSigner(web3, provider.getSigner());
    console.log(signer);
    const sig = await sign(signer, FINAL_STATE);
    console.log(sig);
  });

  portis.showPortis();
}


async function sign(signer: Signer|Wallet, state: State): Promise<Signature> {
  //@ts-ignore: for the 2nd parameter of signStates, only wallet.signMessage is needed
  const wallet = signer as Wallet;
  const [signature] = await signStates([state], [wallet], [0]);
  return signature;
}

