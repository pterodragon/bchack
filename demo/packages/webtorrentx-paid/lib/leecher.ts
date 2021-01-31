import {EventEmitter} from 'events';
import {Instance as IWebTorrent, Torrent} from 'webtorrent';
import {Wire} from "bittorrent-protocol";
import {ethers, BigNumber, utils} from 'ethers';
import {WireSidetalk, WireUndestroyable}  from 'webtorrentx';
//assume client side handle the dotenv import
import {PaymentInterface, Wallet} from 'payment-statechannel';

import createDebug from 'debug';
const log = createDebug('wxp.leecher');

export interface Leecher {
  on(event:'sidetalk', listener: (peerId: string, paylaod:any)=>void): this;
  on(event:'add', listener: (torrent: Torrent)=>void): this;
};

export class Leecher extends EventEmitter {
  constructor(readonly client: IWebTorrent, readonly payment:PaymentInterface<any>) {
    super();

    payment.on("handshakeBack", async(from: string, handshakeId: string, channelId: string, depositAmount: BigNumber, wire: Wire) => {
      const payload = await payment.deposit(from, depositAmount);
      wire._address = from;
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
      if (!wire.peerId.startsWith(process.env.PEER_ID_PREFIX)) return;
      wire.setKeepAlive(true);
      wire._parent = torrent;

      //const undestroy = WireUndestroyable.extend(wire);

      const sidetalk = WireSidetalk.extend(wire);
      sidetalk.on('handshake', async(handshake)=> {
        log(`wire handshake with id=${wire.peerId}`);
        const payload = await payment.handshake(wire.peerId);
        await sidetalk.send({payload});
      });
      sidetalk.on('message', (msg: {payload?: any})=> {
        if (msg.payload) {
          payment.received(msg.payload, wire);
          this.emit('sidetalk', wire.peerId, msg.payload);
        }
      });

      const uninterested = wire.uninterested;
      wire.uninterested = async() => {
        log(`wire ${wire.peerId} uninterested`);
        const payload = await payment.finalize(wire._address);
        await sidetalk.send({payload});
        delete wire._address;
        wire.uninterested = uninterested.bind(wire);
        //undestroy.release();
        wire.uninterested();
      };

    });

    this.emit('add', torrent);
    return torrent; 
  }

}
