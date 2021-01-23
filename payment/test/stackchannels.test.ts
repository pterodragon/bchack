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
  let seederAddress: string = '';

  const leecherWallet = new LocalWallet(provider);
  const leecher = new StateChannelsPayment(leecherWallet);
  function sendToLeecher(payload: any) {
    leecher.received(payload);
  }
  let leecherAddress: string = '';

  beforeAll(async() => {
    seederAddress = await seederWallet.getAddress();
    leecherAddress = await leecherWallet.getAddress();
  });



  it("1: seeder and leecher handshake", async () => {

    const HANDSHAKE_ID1 = "leecher1";

    // setup of event listeners for seeder and leecher
    leecher.on("handshake", async(id: string, from:string) => {
      console.log(`leecher received handeshake from ${from} of id:${id}`);
      //leecher handshake back
      const payload = await leecher.handshake(id, from);
      sendToSeeder(payload);
    });

    seeder.on("handshakeBack", async(id: string, from:string) => {
      console.log(`seeder now knows address of ${id} is ${from}`);
      //  in practice: store this address(from) somewhere for future use, 
      //               maybe a map between IP and address

      //expect both seeder and leecher has the same initial state after handshake
      expect(seeder.getChannel(leecherAddress).signed.state)
        .toBe(leecher.getChannel(seederAddress).signed.state)
    });

    //--------------------------------------------------
    //seeder wants to handshake with leecher 

    //since seeder doesn't know leecher's address yet, 
    // he send leecher a artifical handshakeId for recognizing leecher later
    // in practice: the handshakeId could be the IP address of leecher
    console.log(`seeder wants to handshake with ${HANDSHAKE_ID1}`)
    const payload = await seeder.handshake(HANDSHAKE_ID1);
    sendToLeecher(payload);
  });

  it("2: seeder request eth from leecher", async () => {
    //setup of event listeners for seeder and leecher
    //--------------------------------------------------
    //seeder wants to handshake with leecher to know his/her address
     
  });

});


