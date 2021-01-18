import {WebTorrent} from 'webtorrent';
import {ExTorrent} from '../lib/extorrent'

export default class SCClient extends WebTorrent {
  // State Channel Client

  // @ts-ignore: fuck typescript here
  seed(input, opts, cb?): ExTorrent {
    console.log('SCClient seed')
    return super.seed(input, opts, cb) as ExTorrent
  }
}
