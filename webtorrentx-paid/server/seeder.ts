import WebTorrent from 'webtorrent-hybrid';
import {Wire} from "bittorrent-protocol";
import {ethers, BigNumber, utils} from 'ethers';
import createDebug from 'debug';
import {WireSidetalk, WireControl}  from 'webtorrentx';
import deffered from 'deffered';

import dotenv from 'dotenv';
dotenv.config();

import {StateChannelsPayment, LocalWallet} from 'payment-statechannel';

const log = createDebug('wxp.seeder');
const PIECE_PRICE = utils.parseUnits("10", "wei");
main();


async function main() {
  /* Set up an ethereum provider connected to our local blockchain */
  const provider = new ethers.providers.JsonRpcProvider(
    `http://localhost:${process.env.GANACHE_PORT}`
  );

  const wallet = new LocalWallet(provider, process.env.WALLET1_PRIVATE_KEY);
  const server = new WebTorrent({peerId: '2d5757303031322d724a32683939617936376c5c'});
  const opts = {announce: []}  // disable default public trackers
  const torrent = server.seed(process.env.DATA_FILE||'data_file', opts);
  torrent.on('ready', () => log('ready', torrent.magnetURI));
  torrent.on('download', (bytes: number) => log('download', bytes));
  torrent.on('upload', (bytes: number) => log('upload', bytes));


  const payment = new StateChannelsPayment(wallet);
  payment.on('handshake', async(from: string, handshakeId: string, wire: Wire) => {
    log(`seeder received handeshake from ${from} of id:${handshakeId}`);
    if (!wire) return log(`wire of handshakeId ${handshakeId} not found`);

    wire._address.resolve(from);
    const payload = await payment.handshake(handshakeId, from); 
    await wire.ut_sidetalk.send({payload});
  });
  payment.on('deposited', (from: string, amount: BigNumber, wire: Wire)=> {
    log(`${from} deposited ${amount}`);
    wire._deposited.resolve();
  });
  payment.once('received', (from: string, amount: BigNumber, requestId: string, wire:Wire)=> {
    const index = parseInt(requestId);
    log(`recieved ${amount} from ${from} for index ${index}`);
    wire.control.next();
  });
  payment.on('finalized', (from, conclusion, wire: Wire) => {
    log(`the channel with ${from} is finalized`, conclusion);
    //wire.control.release();
  });

  torrent.on('wire', async(wire:Wire)=> {
    log('on_wire', wire.nodeId, wire.peerId);
    if (wire.peerId !== '2d5757303031322d724a32683939617936376c5b') return;
    wire.setKeepAlive(true);
    //note: add _address and _deposited property to wire for sake of payment
    wire._address = deffered();
    wire._deposited = deffered();
    //node: add wire.sidetalk and wire.control functionality
    const control = WireControl.extend(wire);
    const sidetalk = WireSidetalk.extend(wire);
    sidetalk.on('handshake', async(handshake)=> {
      log('on_handshake', handshake);
    })
    sidetalk.on('message', (msg: {payload?: any})=> {
      if (msg.payload) {
        payment.received(msg.payload, wire);
      }
    });

    control.on('piece', async (index, offset, length)=> {
      log(`on_piece ${index} ${offset} ${length}`);

      const address = await wire._address.promise;
      await wire._deposited.promise;
      const payload = await payment.request(address, PIECE_PRICE, index.toString());
      await sidetalk.send({payload});
    });

  });

}
