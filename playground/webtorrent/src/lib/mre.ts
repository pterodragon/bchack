import * as WebTorrent from 'webtorrent';
import * as Torrent from 'webtorrent/lib/torrent'

export class ExTorrent extends Torrent {
}

export class SCClient extends WebTorrent {
  // State Channel Client

  seed(input, opts, cb?): ExTorrent {
    console.log('SCClient seed')
    return super.seed(input, opts, cb) as ExTorrent
  }
}
