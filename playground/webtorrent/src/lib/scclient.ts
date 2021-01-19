import WebTorrent from 'webtorrent';
import {ExTorrent} from '../lib/extorrent'

// State Channel Client
export class SCClient {
  webtorrent: WebTorrent

  constructor(webtorrent: WebTorrent) {
    this.webtorrent = webtorrent
  }

  seed(input, opts, cb?): ExTorrent {
    console.log('SCClient seed')
    const extor = new ExTorrent(this.webtorrent.seed(input, opts, cb))
    return extor
  }
}
