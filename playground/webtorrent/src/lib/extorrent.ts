import Torrent from 'webtorrent/lib/torrent'
import {ut_sidetalk, ut_sidetalk_opts} from '../extension/ut_sidetalk'
import {Wire} from 'bittorrent-protocol';
import {SCClient} from '../lib/scclient'
import {logger} from '../lib/logger'

export interface ExtorrentOpts {
  ut_sidetalk_opts?: ut_sidetalk_opts
}

export class ExTorrent {
  torrent: Torrent
  opts: ExtorrentOpts
  client: SCClient

  constructor(torrent: Torrent, scclient: SCClient, opts?: ExtorrentOpts) {
    // using composition as typescript inheritance fucked with me
    this.torrent = torrent
    this.opts = opts || {}
    this.client = scclient

    this.torrent.on('ready', () => {
      logger.info('ready Torrent %s', torrent.magnetURI)
    })
    this.torrent.on('wire', (wire: Wire, addr) => {
      wire.use(ut_sidetalk)
      wire.ut_sidetalk.ut_sidetalk_opts = opts?.ut_sidetalk_opts
      wire.ut_sidetalk.set_cbs(this.client, this)

      // at start, seeder won't respond to requests
      if (opts?.ut_sidetalk_opts?.is_seeder) {
        wire.ut_sidetalk.wire_paused = true
      }

      // wraps unchoking
      const unchoke = wire.unchoke
      wire._unchoke_orig = unchoke
      wire.unchoke = () => {
        if (wire.ut_sidetalk.wire_paused) {
          wire.ut_sidetalk.send('notice', {'msg': 'pay up!'})
        } else {
          wire._unchoke_orig()
        }
      }
    })
  }
}
