import {Instance as IWebTorrent, Torrent} from 'webtorrent';
import {Wire} from "bittorrent-protocol";
import {ethers, BigNumber, utils} from 'ethers';
import createDebug from 'debug';
import {WireSidetalk}  from './webtorrentx';
//assume client side handle the dotenv import
import {StateChannelsPayment, PaymentInterface, Wallet} from './payment-statechannel';

const log = createDebug('wxp.leecher');

const PIECE_PRICE = utils.parseUnits("10", "wei");

export class Leecher {
  payment: PaymentInterface<any>;

  //temp map betweeh handshaekId(peerId) and wire

  constructor(readonly client: IWebTorrent, readonly wallet: Wallet) {
    const payment = this.payment = new StateChannelsPayment(wallet);

    payment.on("handshakeBack", async(from: string, handshakeId: string, channelId: string, wire: Wire) => {
      const length = wire.length || 100;
      delete wire.length;
      const payload = await payment.deposit(from, PIECE_PRICE.mul(length));
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
    torrent.on('download', (bytes: number) => log('download', bytes));
    torrent.on('upload', (bytes: number) => log('upload', bytes));

    torrent.on('wire', async(wire:Wire)=> {
      log('wire', wire.nodeId, wire.peerId);
      if (wire.peerId !== '2d5757303031322d724a32683939617936376c5c') return;
      wire.setKeepAlive(true);
      wire.length = torrent.length;

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
        const payload = await payment.finalize(wire.address);
        await sidetalk.send({payload});
        delete wire.address;
      });

    });

    return torrent;
  }

}
