import WebTorrent, {Torrent} from 'webtorrent';
import {Wire} from "bittorrent-protocol";
import {ethers, BigNumber, utils} from 'ethers';
import debug from 'debug';
import {SidetalkExtension, WireController}  from 'webtorrentx';

import dotenv from 'dotenv';
dotenv.config();

import {StateChannelsPayment, LocalWallet} from 'payment-statechannel';

const log = debug('wxp.seeder');
const PIECE_PRICE = utils.parseUnits("10000", "gwei");
main();


async function main() {
  /* Set up an ethereum provider connected to our local blockchain */
  const provider = new ethers.providers.JsonRpcProvider(
    `http://localhost:${process.env.GANACHE_PORT}`
  );

  const wallet = new LocalWallet(provider, process.env.WALLET1_PRIVATE_KEY);
  const client = new WebTorrent({
    //@ts-expect-error
    dhtPort: '40000',
    dht: {
      timeBucketOutdated: 60000, maxAge: 60000,
      host: 'seeder:40000',
    }
  });

  const opts = {announce: []}  // disable default public trackers
  const torrent = client.seed(process.env.DATA_FILE||'data_file', opts);
  torrent.on('ready', () => log('ready', torrent.magnetURI));
  torrent.on('download', (bytes: number) => log('download', bytes));
  torrent.on('upload', (bytes: number) => log('upload', bytes));

  //temp map betweeh handshaekId(peerId) and wire
  const handshakeWires = new Map<string, Wire>();
  //map between wallet address and wire
  const paymentWires = new Map<string, Wire>();
  //map between wire and wallet address
  const sendToWire = (address: string, payload: object) => {
    const wire = paymentWires.get(address);
    if (!wire) throw new Error(`wire of address ${address} not found`);
    wire.ut_sidetalk.send({payload});
  };

  const payment = new StateChannelsPayment(wallet);
  payment.on('handshake', async(from: string, peerId: string) => {
    log(`seeder received handeshake from ${from} of id:${peerId}`);
    const wire = handshakeWires.get(peerId);
    if (!wire) throw new Error(`wire of peerId ${peerId} not found`);

    paymentWires.set(from, wire);
    wire.address = from;
    handshakeWires.delete(peerId);

    const payload = await payment.handshake(peerId, from); 
    sendToWire(peerId, payload);
  });
  payment.on('deposited', (from: string, amount: BigNumber)=> {
    log(`${from} deposited ${amount}`);
  });
  payment.on('received', (from: string, amount: BigNumber)=> {
    log(`recieved ${amount} from ${from}`);
    const control = paymentWires.get(from)?.control;
    if (!control) throw new Error(`control of address ${from} not found`);
    control.next();
  });
  payment.on('finalized', (from, conclusion) => {
    log(`the channel with ${from} is finalized`, conclusion);
    const control = paymentWires.get(from)?.control;
    if (!control) throw new Error(`control of address ${from} not found`);
    control.release();
    paymentWires.delete(from);
  });

  torrent.on('wire', async(wire:Wire)=> {
    log('wire', wire.peerId);
    wire.control = new WireController(wire);
    wire.setKeepAlive(true);
    handshakeWires.set(wire.peerId, wire);

    const sidetalk = await SidetalkExtension.extend(wire);
    sidetalk.on('handshake', async(handshake)=> {
      log('handshake', handshake);
    })
    sidetalk.on('message', (msg: {payload?: any})=> {
      if (msg.payload) {
        payment.received(msg.payload);
      }
    });

    wire.on('piece', async (index, offset, length)=> {
      log(`piece ${index} ${offset} ${length}`);
      const {address} = wire;
      if (!address) throw new Error(`address of wire ${wire.peerId} not found`);

      const payload = await payment.request(address, PIECE_PRICE);
      sidetalk.send({payload});
    });
  });

}
