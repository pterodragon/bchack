import WebTorrent from 'webtorrent-hybrid';
import {Torrent} from 'webtorrent';
import {Wire} from "bittorrent-protocol";
import {ethers, providers, BigNumber, utils} from 'ethers';
import createDebug from 'debug';
import {WireSidetalk, WireShaping}  from 'webtorrentx';
import deffered from 'deffered';

import dotenv from 'dotenv';
dotenv.config();

import {StateChannelsPayment, LocalWallet} from 'payment-statechannel';

const log = createDebug('wxp.seeder');

const PIECE_PRICE = utils.parseUnits(process.env.PIECE_PRICE, process.env.PIECE_PRICE_UNIT);
const NUM_ALLOWANCE = parseInt(process.env.NUM_ALLOWANCE);
log({PIECE_PRICE, NUM_ALLOWANCE});
main();

async function main() {
  /*
  // Set up an ethereum provider connected to our local blockchain
  const provider = new ethers.providers.JsonRpcProvider(
    `http://localhost:${process.env.GANACHE_PORT}`
  );
  */
  const provider = new providers.InfuraProvider(process.env.DAPP_NETWORK, process.env.INFURA_API_KEY);

  const wallet = new LocalWallet(provider, process.env.WALLET1_PRIVATE_KEY);

  const server = new WebTorrent({peerId: '2d5757303031322d724a32683939617936376c5c'});
  const opts = {announce: []}  // disable default public trackers

  const balance = await wallet.getSigner().getBalance();
  log('before seeder balance', balance.toString());

  const torrent: Torrent = server.seed(process.env.DATA_FILE||'data_file', opts);
  log('torrent.length', torrent.length);
  torrent.on('ready', () => log('ready', torrent.magnetURI));
  torrent.on('download', (bytes: number) => log('download', bytes));
  torrent.on('upload', (bytes: number) => log('upload', bytes));


  const payment = new StateChannelsPayment(wallet);
  payment.on('handshake', async(from: string, handshakeId: string, wire: Wire) => {
    log(`seeder received handeshake from ${from} of id:${handshakeId}`);
    if (!wire) return log(`wire of handshakeId ${handshakeId} not found`);

    wire._address.resolve(from);
    const numPiece = Math.ceil(torrent.length/torrent.pieceLength);
    const expectedDeposit = PIECE_PRICE.mul(numPiece + NUM_ALLOWANCE);
    const payload = await payment.handshake(handshakeId, from, expectedDeposit);
    await wire.ut_sidetalk.send({payload});
  });
  payment.on('deposited', (from: string, amount: BigNumber, wire: Wire)=> {
    log(`${from} deposited ${amount}`);
    wire._deposited.resolve();
  });
  payment.on('received', (from: string, amount: BigNumber, requestId: string, wire:Wire)=> {
    const index = parseInt(requestId);
    log(`recieved ${amount} from ${from} for index ${index}`);

    const topped = Math.ceil(amount.div(PIECE_PRICE).toNumber());
    log(`add ${topped} allowance`);
    wire.shaping.allow(topped);
  });
  payment.on('finalized', async(from, conclusion, wire: Wire) => {
    log(`the channel with ${from} is finalized`);
    log(JSON.stringify(conclusion));
    if (wire._deposited) delete wire._deposited;
    wire.shaping.release();
    
    const balance = await wallet.getSigner().getBalance();
    log('after seeder balance', balance.toString());
    //wire.sidetalk.send({finalized: true});
  });

  torrent.on('wire', async(wire:Wire)=> {
    log('on_wire', wire.nodeId, wire.peerId);
    if (wire.peerId !== '2d5757303031322d724a32683939617936376c5b') return;
    wire.setKeepAlive(true);
    //note: add properties to wire for sake of payment
    wire._address = deffered();
    wire._deposited = deffered();

    //node: etend wire functionality
    const sidetalk = WireSidetalk.extend(wire);
    sidetalk.on('handshake', async(handshake)=> {
      log('on_handshake', handshake);
    })
    sidetalk.on('message', (msg: {payload?: any})=> {
      if (msg.payload) {
        payment.received(msg.payload, wire);
      }
    });

    const shaping = WireShaping.extend(wire);
    shaping.on('no-allowance', async()=> {
      log(`${wire.peerId} no allowance`);
      const address = await wire._address.promise;
      //request only after deposited
      await wire._deposited.promise;
      const payload = await payment.request(address, PIECE_PRICE.mul(NUM_ALLOWANCE));
      await sidetalk.send({payload});
    });

  });

}

