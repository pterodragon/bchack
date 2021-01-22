/* Import ethereum wallet utilities  */
import { ethers, Signer } from "ethers";
import { StateChannelsPayment } from "../lib/statechannels";
import {LocalWallet} from "./localwallet";
import globalSetup from "./jest/contract-test-setup";


main();

async function main() {
  await globalSetup();

  /* Set up an ethereum provider connected to our local blockchain */
  const provider = new ethers.providers.JsonRpcProvider(
    `http://localhost:${process.env.GANACHE_PORT}`
  );

  const seederWallet = new LocalWallet(provider);
  await seederWallet.init();
  const seeder = new StateChannelsPayment(seederWallet);
  function sendToSeeder(payload: any) {
    seeder.received(payload);
  }

  const leecherWallet = new LocalWallet(provider);
  await leecherWallet.init();
  const leecher = new StateChannelsPayment(leecherWallet);
  function sendToLeecher(payload: any) {
    leecher.received(payload);
  }


  //setup of event listeners for seeder and leecher
  leecher.on("handshake", async(from: string) => {
    console.log(`leecher received handeshake from ${from}`);
    //leecher handshake back
    const payload = await leecher.handshake(from);
    sendToSeeder(payload);

    //@ts-expect-error
    console.log(seeder.getChannel(leecherWallet.getAddress()).signed.state)
    //@ts-expect-error
    console.log(leecher.getChannel(seederWallet.getAddress()).signed.state)
  });

  //seeder wants to handshake with leecher to know his/her address
  const payload = await seeder.handshake();
  sendToLeecher(payload);
}


