/* Import ethereum wallet utilities  */
import { ethers } from "ethers";
import { StateChannelsPayment } from "../lib/statechannels";
import {LocalWallet} from "./localwallet";
const {BigNumber} = ethers;
import { ETHERLIME_ACCOUNTS } from "@statechannels/devtools";

/* Set up an ethereum provider connected to our local blockchain */
const provider = new ethers.providers.JsonRpcProvider(
  `http://localhost:${process.env.GANACHE_PORT}`
);


describe("test statechannel payment", function() {

  //note: ETHERLIME_ACCOUNTS are funded 1 million in "@statechannels/devtools" GanacheServer
  const leecherWallet = new LocalWallet(provider, ETHERLIME_ACCOUNTS[0].privateKey);
  const leecher = new StateChannelsPayment(leecherWallet);
  let leecherAddress: string = '';

  const seederWallet = new LocalWallet(provider, ETHERLIME_ACCOUNTS[1].privateKey);
  const seeder = new StateChannelsPayment(seederWallet);
  let seederAddress: string = '';

  //mock/fake sending message via webrtc to other party
  async function sendToLeecher(payload: any) {
    return leecher.received(payload).catch(err=>console.error(err));
  }
  async function sendToSeeder(payload: any) {
    return seeder.received(payload).catch(err=>console.error(err));
  }

  beforeAll(async() => {
    seederAddress = await seederWallet.getAddress();
    leecherAddress = await leecherWallet.getAddress();
    console.log({seederAddress, leecherAddress});
  });



  it("1: seeder and leecher handshake", async (done) => {

    const HANDSHAKE_ID1 = "seeder1";

    seeder.on("handshake", async(from: string, handshakeId: string) => {
      //2. seeder received a handshake from leecher
      //--------------------------------------------------
      console.log(`seeder received handeshake from ${from} of id:${handshakeId}`);

      expect(from).toBe(leecherAddress);
      expect(handshakeId).toBe(HANDSHAKE_ID1);

      //seeder handshake back
      const payload = await seeder.handshake(handshakeId, from);
      await sendToLeecher(payload);
    });

    leecher.on("handshakeBack", async(from: string, handshakeId: string, channelId: string) => {
      //3. leecher received a handshake back from seeker
      //--------------------------------------------------
      console.log(`leecher now knows address of ${handshakeId} is ${from}`);

      expect(from).toBe(seederAddress);
      //  in practice: store this address(from) somewhere for future use, 
      //               maybe a map between IP and address
      expect(handshakeId).toBe(HANDSHAKE_ID1);

      //expect both seeder and leecher has the same initial state after handshake
      const seederChannel = seeder.getChannel(leecherAddress);
      const leecherChannel = leecher.getChannel(seederAddress);
      expect(seederChannel.latestState).toBe(leecherChannel.latestState)

      done();
    });


    //1. leecher wants to handshake with leecher 
    //--------------------------------------------------
    //since leecher doesn't know seeder's address yet, 
    // he send seeder a artifical handshakeId for recognizing the seeder later
    // in practice: the handshakeId could be the IP address of leecher
    console.log(`leecher wants to handshake with ${HANDSHAKE_ID1}`)
    const payload = await leecher.handshake(HANDSHAKE_ID1);
    await sendToSeeder(payload);
  });


  it("2: leecher deposit eth to the channel", async(done) => {
    const DEPOSIT_AMOUNT = "1000";

    //2. seeder received deposited event
    //--------------------------------------------------
    seeder.on('deposited', (address, amount)=> {
      expect(address).toBe(leecherAddress);
      expect(amount.toString()).toBe(DEPOSIT_AMOUNT);
      done();
    });

    //1. leecher deposit to the channel
    //--------------------------------------------------
    console.log(`leecher deposit ${DEPOSIT_AMOUNT} to the channel of ${seederAddress}`);
    const payload = await leecher.deposit(seederAddress, BigNumber.from(DEPOSIT_AMOUNT));
    await sendToSeeder(payload);
  });

  it("3: seeder request eth from leecher", async (done) => {
    const REQUEST_AMOUNT = "101";
    //2. leecher received a request from seeker
    //--------------------------------------------------
    leecher.on("requested", async(from, amount, agree)=> {
      console.log(`leecher received a request of ${amount} from ${from}`);
      expect(from).toBe(seederAddress);
      expect(amount.toString()).toBe(REQUEST_AMOUNT);

      //leecher agrees on the amount and response
      const payload =  await agree();
      await sendToSeeder(payload);
    });

    seeder.on("received", (from, amount)=> {
      //3. seeder sees leecher agreed on the requested amount
      //--------------------------------------------------
      console.log(`seeder sees ${from} agreed on the requested amount ${amount} wei`);

      expect(from).toBe(leecherAddress);
      expect(amount.toString()).toBe(REQUEST_AMOUNT);

      //expect both seeder and leecher has the same state after leecher agree on the request
      const seederChannel = seeder.getChannel(leecherAddress);
      const leecherChannel = leecher.getChannel(seederAddress);
      expect(seederChannel.latestState).toBe(leecherChannel.latestState)
      done();
    });

    //1. seeder requests eth from leecher 
    //--------------------------------------------------
    console.log(`seeder requests ${leecherAddress} for ${REQUEST_AMOUNT} wei`);
    const payload = await seeder.request(leecherAddress, BigNumber.from(REQUEST_AMOUNT));
    await sendToLeecher(payload);
  });

  //note: I know in real case there is no incentive for leecher to call for conclusion...
  //for Demo let's assume all participants are super honest !
  it("4: leecher wants to finalize the channel", async(done)=>{

    //2. seeder received the finalize request
    //--------------------------------------------------
    seeder.on("finalized", async(from: string, conclusion: any)=>{
      console.log(`the channel between seeder and ${from} is finalized`);
      console.log(conclusion);
      done();
    })

    //1. leecher asks for conclusion of the channel with seeder
    //--------------------------------------------------
    const payload = await leecher.finalize(seederAddress);
    //payload.signed.state.channel.participants.map(p=>leecher.getChannel(seederAddress).getSignedState(p).state).map(logJSON);
    await sendToSeeder(payload);
  });


});

//for debug use
function logJSON(obj: any) {
  console.log(JSON.stringify(obj, null, 2));
}


