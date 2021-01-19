import WebTorrent from 'webtorrent';
import {ExTorrent} from '../lib/extorrent'

// State Channel Client
export class SCClient {
  webtorrent: WebTorrent

  constructor(webtorrent: WebTorrent) {
    this.webtorrent = webtorrent
  }

  seed(input, opts, onseed): ExTorrent {
    console.log('SCClient seed')
    const extor = new ExTorrent(this.webtorrent.seed(input, opts, onseed))
    return extor
  }

  add(torrentId, opts = {}, ontorrent = () => {}): ExTorrent {
    console.log('SCClient add')
    const extor = new ExTorrent(this.webtorrent.add(torrentId, opts, ontorrent))
    return extor
  }
}
