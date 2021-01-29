import {Instance as IWebTorrent, Torrent} from 'webtorrent';
import {Wire} from "bittorrent-protocol";
import {ethers, BigNumber, utils} from 'ethers';
import createDebug from 'debug';
import {WireSidetalk}  from 'webtorrentx';
//assume client side handle the dotenv import
import {StateChannelsPayment, PaymentInterface, Wallet} from 'payment-statechannel';

const debug = createDebug('wxp.leecher');
const log = (...args)=> {
  //@ts-ignore
  debug(...args);
  console.log(...args);
}
const PIECE_PRICE = utils.parseUnits("10000", "gwei");

export class Leecher {
  payment: PaymentInterface<any>;

  //temp map betweeh handshaekId(peerId) and wire
  handshakeWires = new Map<string, Wire>();

  constructor(readonly client: IWebTorrent, readonly wallet: Wallet) {
    const payment = this.payment = new StateChannelsPayment(wallet);
    const {handshakeWires} = this;

    //map between wallet address and wire
    const paymentWires = new Map<string, Wire>();
    //map between wire and wallet address
    const sendToWire = (address: string, payload: object) => {
      const wire = paymentWires.get(address);
      if (!wire) return log(`wire of address ${address} not found`);
      wire.ut_sidetalk.send({payload});
    };

    payment.on("handshakeBack", async(from: string, handshakeId: string, channelId: string) => {
      const wire = handshakeWires.get(handshakeId);
      if (!wire) return log(`wire of handshakeId=${handshakeId} not found`);
      paymentWires.set(from, wire);
      handshakeWires.delete(handshakeId);
      
      const length = wire.length || 100;
      delete wire.length;
      const payload = await payment.deposit(from, PIECE_PRICE.mul(length));
      sendToWire(from, payload);
    });
    payment.on("requested", async(from, amount, agree)=> {
      log(`leecher received a request of ${amount} from ${from}`);

      //leecher agrees on the amount and response
      const payload =  await agree();
      sendToWire(from, payload);
    });
  }

  add(uri: string): Torrent {
    const {payment, handshakeWires} = this;

    const torrent = this.client.add(uri);
    torrent.on('download', (bytes: number) => log('download', bytes));
    torrent.on('upload', (bytes: number) => log('upload', bytes));

    torrent.on('wire', async(wire:Wire)=> {
      log('wire', wire.nodeId, wire.peerId);
      if (wire.nodeId !== '37a5409fee9c') return;
      handshakeWires.set(wire.peerId, wire);
      wire.setKeepAlive(true);
      wire.length = torrent.length;

      const sidetalk = await WireSidetalk.extend(wire);
      sidetalk.on('handshake', async(handshake)=> {
        log('handshake', handshake);
      })
      sidetalk.on('message', (msg: {payload?: any})=> {
        if (msg.payload) {
          payment.received(msg.payload);
        }
      });
      log(`handshake with id=${wire.peerId}`);
      const payload = await payment.handshake(wire.peerId);
      sidetalk.send({payload});

      wire.on('piece', async (index, offset, length)=> {
        log(`piece ${index} ${offset} ${length}`);
        const {address} = wire;
        if (!address) return (`address of wire ${wire.peerId} not found`);

        const payload = await payment.request(address, PIECE_PRICE);
        sidetalk.send({payload});
      });

      wire.on('uninterested', async() => {
        const payload = await payment.finalize(wire.address);
        sidetalk.send({payload});
        delete wire.address;
      });

    });

    return torrent;
  }

}