import WebTorrent from 'webtorrent';
import {ExTorrent, ExtorrentOpts} from '../lib/extorrent'
import {logger} from '../lib/logger'
import {ut_control} from '../lib/ut_control'
import {Wire} from 'bittorrent-protocol';
import EventEmitter from 'eventemitter3'

// State Channel Client
export class SCClient extends EventEmitter implements ut_control {
  webtorrent: WebTorrent
  extorrent_opts: ExtorrentOpts

  constructor(webtorrent: WebTorrent, extorrent_opts?: ExtorrentOpts) {
    super()
    this.webtorrent = webtorrent
    this.extorrent_opts = extorrent_opts || {}
  }

  seed(input, opts, onseed): ExTorrent {
    logger.info('SCClient seed')
    return new ExTorrent(this.webtorrent.seed(input, opts, onseed), this, this.extorrent_opts)
  }

  add(torrentId, opts = {}, ontorrent = () => {}): ExTorrent {
    logger.info('SCClient add')
    return new ExTorrent(this.webtorrent.add(torrentId, opts, ontorrent), this)
  }

  _onTorrentEvent(torrent: ExTorrent, wire: Wire, event: string, ...args) : void {
    logger.debug('_onTorrentEvent %s, %s, %o', (torrent.torrent.infoHash), event, args)
    if (['uninterested', 'interested', 'upload', 'piece', 'wire', 'close'].includes(event)) {
      switch (event) {
        case 'close':
          this.emit('disconnected', wire)
          break
        case 'wire':
          this.emit('established', wire)
          break
        case 'interested':
          this.emit('peer-interested', wire)
          break
        case 'uninterested':
          this.emit('peer-uninterested', wire)
          break
        default:
          break
      }
      this.emit(event, torrent, wire)
    }
  }

  allow(wire: Wire, piece_count: number): void {
    wire.ut_sidetalk.topup_pieces(piece_count)
  }
}
