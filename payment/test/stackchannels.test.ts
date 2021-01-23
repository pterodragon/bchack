/* Import ethereum wallet utilities  */
import { ethers, Signer } from "ethers";
import { extractLastAllocationItem, StateChannelsPayment } from "../lib/statechannels";
import {LocalWallet} from "./localwallet";
const {BigNumber} = ethers;
import { convertBytes32ToAddress} from "@statechannels/nitro-protocol"; 
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



  it("1: seeder and leecher handshake", async () => {

    const HANDSHAKE_ID1 = "leecher1";

    leecher.on("handshake", async(from: string, id: string) => {
      //2. leecher received a handshake from seeker
      //--------------------------------------------------
      console.log(`leecher received handeshake from ${from} of id:${id}`);

      expect(from).toBe(seederAddress);

      //leecher handshake back
      const payload = await leecher.handshake(id, from);
      await sendToSeeder(payload);
    });

    seeder.on("handshakeBack", async(from: string, id: string) => {
      //3. seeder received a handshake from seeker
      //--------------------------------------------------
      console.log(`seeder now knows address of ${id} is ${from}`);
      //  in practice: store this address(from) somewhere for future use, 
      //               maybe a map between IP and address
      expect(from).toBe(leecherAddress);

      //expect both seeder and leecher has the same initial state after handshake
      const seederChannel = seeder.getChannel(leecherAddress);
      const leecherChannel = leecher.getChannel(seederAddress);
      expect(seederChannel.signed.state).toBe(leecherChannel.signed.state)
    });

    //1. seeder wants to handshake with leecher 
    //--------------------------------------------------
    //since seeder doesn't know leecher's address yet, 
    // he send leecher a artifical handshakeId for recognizing leecher later
    // in practice: the handshakeId could be the IP address of leecher
    console.log(`seeder wants to handshake with ${HANDSHAKE_ID1}`)
    const payload = await seeder.handshake(HANDSHAKE_ID1);
    await sendToLeecher(payload);
  });


  it("2: leecher deposit eth to the channel", async() => {
    const DEPOSIT_AMOUNT = "1000";
    console.log(`leecher deposit ${DEPOSIT_AMOUNT} to the channel of ${seederAddress}`);
    const ret = await leecher.deposit(seederAddress, BigNumber.from(DEPOSIT_AMOUNT));
    expect(ret).toBeTruthy();
  });

  it("3: seeder request eth from leecher", async () => {
    const REQUEST_AMOUNT = "101";
    //2. leecher received a request from seeker
    //--------------------------------------------------
    leecher.on("requested", async(from, amount, agree)=> {
      console.log(`leecher received a request of ${amount} from ${from}`);
      expect(from).toBe(seederAddress);
      expect(amount.toString()).toBe(REQUEST_AMOUNT);

      const leecherChannel = leecher.getChannel(seederAddress);
      const allocation = extractLastAllocationItem(leecherChannel.state);
      expect(allocation.amount.toString()).toBe(REQUEST_AMOUNT);
      expect(convertBytes32ToAddress(allocation.destination)).toBe(seederAddress);

      //leecher agrees on the amount and response
      const payload =  await agree();
      await sendToSeeder(payload).catch(err=>console.error(err));
    });

    seeder.on("received", (from, amount)=> {
      //3. seeder sees leecher agreed on the requested amount
      //--------------------------------------------------
      console.log(`seeder sees ${from} agreed on the requested amount ${amount} wei`);

      expect(from).toBe(leecherAddress);
      expect(amount.toString()).toBe(REQUEST_AMOUNT);

      const seederChannel = seeder.getChannel(leecherAddress);
      const allocation = extractLastAllocationItem(seederChannel.state);
      expect(allocation.amount.toString()).toBe(REQUEST_AMOUNT);
      expect(convertBytes32ToAddress(allocation.destination)).toBe(seederAddress);


      //expect both seeder and leecher has the same state after leecher agree on the request
      const leecherChannel = leecher.getChannel(seederAddress);
      expect(seederChannel.signed.state).toBe(leecherChannel.signed.state)
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
    seeder.on("finalized", async(from: string, log: any)=>{
      console.log(`the channel between seeder and ${from} is finalized`);
      console.log(log);
      done();
    })

    //leecher asks for conclusion of the channel with seeder
    //--------------------------------------------------
    const payload = await leecher.finalize(seederAddress);
    await sendToSeeder(payload);
  });


});


