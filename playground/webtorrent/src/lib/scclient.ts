import WebTorrent from 'webtorrent';
import {ExTorrent, ExtorrentOpts} from '../lib/extorrent'
import {logger} from '../lib/logger'
// import {ut_control} from '../lib/ut_control'
// import EventEmitter from 'eventemitter3';

// State Channel Client
export class SCClient {
  webtorrent: WebTorrent
  extorrent_opts: ExtorrentOpts

  constructor(webtorrent: WebTorrent, extorrent_opts?: ExtorrentOpts) {
    this.webtorrent = webtorrent
    this.extorrent_opts = extorrent_opts || {}
  }

  seed(input, opts, onseed): ExTorrent {
    logger.info('SCClient seed')
    return new ExTorrent(this.webtorrent.seed(input, opts, onseed), this.extorrent_opts)
  }

  add(torrentId, opts = {}, ontorrent = () => {}): ExTorrent {
    logger.info('SCClient add')
    return new ExTorrent(this.webtorrent.add(torrentId, opts, ontorrent))
  }
  
}
