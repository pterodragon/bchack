import dotenv from "dotenv"
dotenv.config()
import {SCClient} from 'exwebtorrent/lib/scclient'
import {logger} from '../lib/logger'
import {StateChannelsPayment, Wallet} from "statechannel"
import {Wire} from 'bittorrent-protocol'
import { ethers } from "ethers";
const {BigNumber} = ethers;


export class PaidWTClient extends SCClient {
  private wallet: Wallet
  private channel: StateChannelsPayment
  private check_fund_timeout = 10000
  private request_fund_handle = undefined

  constructor(wallet: Wallet, ...args) {
    super(...args)
    this.wallet = wallet
    this.channel = new StateChannelsPayment(wallet)
  }

  private request_fund_if_underfunded(wire) {
    if (wire.ut_sidetalk.is_underfunded()) {
    }
  }

  start_request_fund(wire) {
    this.request_fund_handle = setInterval(() => {
      this.request_fund_if_underfunded(wire)
    }, this.check_fund_timeout)
    // const payload = await this.channel.request(leecherAddress, BigNumber.from(REQUEST_AMOUNT));
    // await sendToLeecher(payload);

    // wire.ut_sidetalk.send(', {'payload': payload})
  }

  async run_seeder() {
    const filepath = process.env.SEED_FILEPATH

    const {ut_sidetalk_opts: {is_leecher, is_seeder}} = this.extorrent_opts
    this.on('established', (wire: Wire) => {
      if (!is_seeder) {
        return
      }
      this.channel.on('deposited', (address, amount)=> {
        // TODO verify address & amount
        this.start_request_fund(wire);
      })
      this.channel.on("handshake", async (from: string, handshakeId: string) => {
        logger.info('seeder got handshakeId: %s, from %s', handshakeId, from)
        wire.peer_address = from
        const payload = await this.channel.handshake(handshakeId, from)
        this._send_payload(wire, payload, 'sc handshake')
      })
      wire.ut_sidetalk.on('sc handshake', (wire, payload) => {
        this._rcvd_payload(wire, payload)
      })

      this.channel.on('deposited', (address, amount)=> {
      });
    })


    await new Promise((resolve, reject) => {
      try {
        const seed_opts = {announceList: []}  // disable default public trackers

        this.seed(filepath, seed_opts, (torrent) => resolve)
      } catch (err) {
        reject(err)
      }
    })
    logger.info('run_seeder finished')
  }

  private _rcvd_payload(wire, payload) {
    this.channel.received(payload).catch((err) => {logger.error('channel errored when receiving payload: %o', err)})
  }

  private _send_payload(wire, payload, tag) {
    wire.ut_sidetalk.send(tag, {'payload': payload})
  }

  async run_leecher() {
    const magnet_uri = 'magnet:?xt=urn:btih:861af4464ce3dd160c368a224ab2a110d7c1d485&dn=Sintel.2010.720p.mkv'

    // setInterval(() => {
    //   this.webtorrent.torrents.forEach(
    //     (torrent) => {
    //       torrent.wires.forEach(
    //         (wire) => {
    //           wire.ut_sidetalk.send('topup', {})
    //         }
    //       )
    //     }
    //   )}, 15000)
    //
    //
    const {ut_sidetalk_opts: {is_leecher, is_seeder}} = this.extorrent_opts
    this.on('established', (wire: Wire) => {
      if (!is_leecher) {
        return
      }
      this.channel.on("handshakeBack", async (from: string, handshakeId: string) => {
        logger.info('leecher got handshakeBack Id: %s, from %s', handshakeId, from)
        wire.peer_address = from
        const DEPOSIT_AMOUNT = "5000000000000";
        logger.info('deposit: %s, %o', wire.peer_address, BigNumber.from(DEPOSIT_AMOUNT))
        const payload = await this.channel.deposit(wire.peer_address, BigNumber.from(DEPOSIT_AMOUNT))
        this._send_payload(wire, payload, 'deposit')
      })
      wire.ut_sidetalk.on('sc handshake', (wire, payload) => {
        this._rcvd_payload(wire, payload)
      })
      const handshake_id = this.webtorrent.nodeId + '_' + wire.peerId;
      (async () => {
        const payload = await this.channel.handshake(handshake_id)
        this._send_payload(wire, payload, 'sc handshake')
      }
      )();
      logger.info('new wire established')
    })

    const torrent = await new Promise((resolve, reject) => {
      try {
        return this.add(magnet_uri, {
          announce: []
        }, (torrent) => resolve)
      } catch (err) {
        reject(err)
      }
    })

    logger.info('run_leecher finished')
  }
}

