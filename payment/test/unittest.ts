/* Import ethereum wallet utilities  */
import { ethers, Signer } from "ethers";
import { StateChannelsPayment } from "../lib/statechannels";
import {LocalWallet} from "./localwallet";

/* Set up an ethereum provider connected to our local blockchain */
const provider = new ethers.providers.JsonRpcProvider(
  `http://localhost:${process.env.GANACHE_PORT}`
);


describe("test statechannel payment", function() {
  const seederWallet = new LocalWallet(provider);
  const seeder = new StateChannelsPayment(seederWallet);
  function sendToSeeder(payload: any) {
    seeder.received(payload);
  }

  const leecherWallet = new LocalWallet(provider);
  const leecher = new StateChannelsPayment(leecherWallet);
  function sendToLeecher(payload: any) {
    leecher.received(payload);
  }


  it("0: init wallets", async()=> {
    return Promise.all([
      seederWallet.init(),
      leecherWallet.init()
    ]);
  });

  it("1: seeder and leecher need to handshake", async () => {
    //setup of event listeners for seeder and leecher
    leecher.on("handshake", async(from:string) => {
      console.log(`leecher received handeshake from ${from}`);
      try {
      //leecher handshake back
      const payload = await leecher.handshake(from);
      sendToSeeder(payload);

      //@ts-expect-error
      expect(seeder.getChannel(leecherWallet.getAddress()).signed.state)
      //@ts-expect-error
        .toBe(leecher.getChannel(seederWallet.getAddress()).signed.state)
      }catch(err) {
        console.error(err);
      }
    });

    //seeder wants to handshake with leecher to know his/her address
    const payload = await seeder.handshake();
    sendToLeecher(payload);
  });
});


