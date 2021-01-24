import {SCClient} from 'exwebtorrent/lib/scclient'
import dotenv from "dotenv";
import {logger} from '../lib/logger'
import {Wallet} from "statechannel";

dotenv.config()

export class PaidWTClient extends SCClient {
  private wallet: Wallet

  constructor(wallet: Wallet, ...args) {
    super(...args)
    this.wallet = wallet
  }

  async run_seeder() {
    const filepath = process.env.SEED_FILEPATH;

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

