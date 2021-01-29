import WebTorrent from 'webtorrent-hybrid';
import {Wire} from "bittorrent-protocol";
import {ethers, BigNumber, utils} from 'ethers';
import createDebug from 'debug';
import {WireSidetalk, WireControl}  from 'webtorrentx';

import dotenv from 'dotenv';
dotenv.config();

import {StateChannelsPayment, LocalWallet} from 'payment-statechannel';

const log = createDebug('wxp.seeder');
const PIECE_PRICE = utils.parseUnits("1", "wei");
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

    wire.address = from;
    const payload = await payment.handshake(handshakeId, from); 
    wire.ut_sidetalk.send({payload});
  });
  payment.on('deposited', (from: string, amount: BigNumber)=> {
    log(`${from} deposited ${amount}`);
  });
  payment.on('received', (from: string, amount: BigNumber, wire:Wire)=> {
    log(`recieved ${amount} from ${from}`);
    const control = wire.control;
    if (!control) return log(`control of address ${from} not found`);
    control.next();
  });
  payment.on('finalized', (from, conclusion, wire: Wire) => {
    log(`the channel with ${from} is finalized`, conclusion);
    wire.control.release();
  });

  torrent.on('wire', async(wire:Wire)=> {
    log('wire', wire.nodeId, wire.peerId);
    if (wire.peerId !== '2d5757303031322d724a32683939617936376c5b') return;
    wire.setKeepAlive(true);

    const control = WireControl.extend(wire);
    const sidetalk = WireSidetalk.extend(wire);
    sidetalk.on('handshake', async(handshake)=> {
      log('handshake', handshake);
    })
    sidetalk.on('message', (msg: {payload?: any})=> {
      if (msg.payload) {
        payment.received(msg.payload, wire);
      }
    });

    wire.on('piece', async (index, offset, length)=> {
      log(`piece ${index} ${offset} ${length}`);
      const {address} = wire;
      if (!address) return log(`address of wire ${wire.peerId} not found`);

      const payload = await payment.request(address, PIECE_PRICE);
      await sidetalk.send({payload});
    });
  });

}
