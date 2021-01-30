import {Instance as IWebTorrent, Torrent} from 'webtorrent';
import {Wire} from "bittorrent-protocol";
import {ethers, BigNumber, utils} from 'ethers';
import createDebug from 'debug';
import {WireSidetalk}  from './webtorrentx';
//assume client side handle the dotenv import
import {StateChannelsPayment, PaymentInterface, Wallet} from './payment-statechannel';

const log = createDebug('wxp.leecher');

const PIECE_PRICE = BigNumber.from(process.env.PIECE_PRICE);
const NUM_ALLOWANCE = parseInt(process.env.NUM_ALLOWANCE);

export class Leecher {
  payment: PaymentInterface<any>;

  //temp map betweeh handshaekId(peerId) and wire

  constructor(readonly client: IWebTorrent, readonly wallet: Wallet) {
    const payment = this.payment = new StateChannelsPayment(wallet);

    payment.on("handshakeBack", async(from: string, handshakeId: string, channelId: string, wire: Wire) => {
      const depositAmount = PIECE_PRICE.mul(wire.length||1048576 + NUM_ALLOWANCE);
      const payload = await payment.deposit(from, depositAmount);
      delete wire.length;
      await wire.ut_sidetalk.send({payload});
    });
    payment.on("requested", async(from, amount, agree, wire)=> {
      log(`leecher received a request of ${amount} from ${from}`);

      //leecher agrees on the amount and response
      const payload =  await agree();
      await wire.ut_sidetalk.send({payload});
    });
  }

  add(uri: string): Torrent {
    const {payment} = this;

    const torrent = this.client.add(uri);
    let destroy = torrent.destroy;
    console.log({destroy});
    torrent.destroy = ()=>console.log('torrent cannot destroy now');
    torrent.on('download', (bytes: number) => log('download', bytes));
    torrent.on('upload', (bytes: number) => log('upload', bytes));

    torrent.on('wire', async(wire:Wire)=> {
      log('wire', wire.nodeId, wire.peerId);
      if (wire.peerId !== '2d5757303031322d724a32683939617936376c5c') return;
      wire.setKeepAlive(true);
      wire.length = torrent.length;
      console.log('wire.length', wire.length);

      const sidetalk = WireSidetalk.extend(wire);
      sidetalk.on('handshake', async(handshake)=> {
        log(`wire handshake with id=${wire.peerId}`);
        const payload = await payment.handshake(wire.peerId);
        await sidetalk.send({payload});
      })
      sidetalk.on('message', (msg: {payload?: any})=> {
        if (msg.payload) {
          payment.received(msg.payload, wire);
        }
      });

      wire.on('uninterested', async() => {
        log(`wire ${wire.peerId} uninterested`);
        const payload = await payment.finalize(wire.address);
        await sidetalk.send({payload});
        delete wire.address;
      });

    });

    torrent.on('done', ()=> {
      torrent.destroy = destroy.bind(torrent);
      destroy = undefined;
    });

    return torrent; }

}
