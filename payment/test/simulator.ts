/* Import ethereum wallet utilities  */
import { ethers } from "ethers";
import { StateChannelsPayment } from "../lib/statechannels";
import {LocalWallet} from "../lib/wallet";

/* Set up an ethereum provider connected to our local blockchain */
const provider = new ethers.providers.JsonRpcProvider(
  `http://localhost:${process.env.GANACHE_PORT}`
);

const seederWallet = new LocalWallet();
const seeder = new StateChannelsPayment(seederWallet);

const leecherWallet = new LocalWallet();
const leecher = new StateChannelsPayment(leecherWallet);

it("1: seeder and leecher need to handshake", async () => {
  const payload = await seeder.handshake();

  //say by some communication protocal the leecher get the payload
  leecher.received(payload);
});
