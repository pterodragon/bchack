import {SCClient} from 'exwebtorrent/lib/scclient'
import dotenv from "dotenv";
import {logger} from '../lib/logger'
import {StateChannelsPayment, Wallet} from "statechannel";
import {Wire} from 'bittorrent-protocol';

dotenv.config()

export class PaidWTClient extends SCClient {
  private wallet: Wallet
  private channel: StateChannelsPayment

  constructor(wallet: Wallet, ...args) {
    super(...args)
    this.wallet = wallet
    this.channel = new StateChannelsPayment(wallet)
  }

  async run_seeder() {
    const filepath = process.env.SEED_FILEPATH;

    const {ut_sidetalk_opts: {is_leecher, is_seeder}} = this.extorrent_opts
    this.on('established', (wire: Wire) => {
      if (is_seeder) {
        this.channel.on("handshake", async(from: string, handshakeId: string) => {
          logger.info('seeder received payment handshake')
        }
      }
      logger.info('new wire established')
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
      if (is_leecher) {
        logger.info('ztest handshake')
        const handshake_id = this.webtorrent.nodeId + '_' + wire.peerId;
        (async () => {
          const payload = await this.channel.handshake(handshake_id);
          wire.ut_sidetalk.send('sc handshake', payload)
        }
        )();
      }
      logger.info('new wire established')
    })

    const torrent = await new Promise((resolve, reject) => {
      try {
        return this.add(magnet_uri, (torrent) => resolve)
      } catch (err) {
        reject(err)
      }
    })

    logger.info('run_leecher finished')
  }
}

