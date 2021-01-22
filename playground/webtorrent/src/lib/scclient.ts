import WebTorrent from 'webtorrent';
import {ExTorrent, ExtorrentOpts} from '../lib/extorrent'
import {logger} from '../lib/logger'
import {ut_control} from '../lib/ut_control'
import {Wire} from 'bittorrent-protocol';
import EventEmitter from 'eventemitter3'

// State Channel Client
// export class SCClient implements ut_control {
export class SCClient extends EventEmitter {
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
    logger.info('_onTorrentEvent %s, %s, %o', (torrent.torrent.infoHash), event, args)
    if (['uninterested', 'interested', 'upload', 'piece'].includes(event)) {
      this.emit(event, torrent, wire)
    }
  }

  allow(torrent: ExTorrent, wire: Wire, piece_count: number): void {
  }
}
