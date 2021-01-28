import WebTorrent from 'webtorrent';
import {ExTorrent, ExtorrentOpts} from '../lib/extorrent'
import {logger} from '../lib/logger'
import {ut_control} from '../lib/ut_control'
import {Wire} from 'bittorrent-protocol';
import EventEmitter from 'eventemitter3'
import BitField from 'bitfield'

// State Channel Client
export class SCClient extends EventEmitter implements ut_control {
  webtorrent: WebTorrent
  extorrent_opts: ExtorrentOpts

  constructor(extorrent_opts?: ExtorrentOpts) {
    super()
    this.extorrent_opts = extorrent_opts || {}
    const {ut_sidetalk_opts: {is_leecher, is_seeder}} = this.extorrent_opts
    const webtorrent_opts = {dht: {timeBucketOutdated: 60000, maxAge: 60000}}
    if (is_leecher) {
      webtorrent_opts.dht['bootstrap'] = [`${process.env.SEEDER_HOST}:${process.env.SEEDER_DHT_PORT}`]
      webtorrent_opts['dhtPort'] = process.env.LEECHER_DHT_PORT
    } else {
      webtorrent_opts.dht['host'] = `${process.env.SEEDER_HOST}:${process.env.SEEDER_DHT_PORT}`
      webtorrent_opts['dhtPort'] = process.env.SEEDER_DHT_PORT
    }

    this.webtorrent = new WebTorrent(webtorrent_opts)
  }

  seed(input, opts, onseed): ExTorrent {
    logger.info('SCClient seed: %s', input)
    return new ExTorrent(this.webtorrent.seed(input, opts, onseed), this, this.extorrent_opts)
  }

  add(torrentId, opts, ontorrent): ExTorrent {
    logger.info('SCClient add: %s', torrentId)
    return new ExTorrent(this.webtorrent.add(torrentId, opts, ontorrent), this, this.extorrent_opts)
  }

  _onTorrentEvent(torrent: ExTorrent, wire: Wire, event: string, ...args): void {
    logger.debug('_onTorrentEvent %s, %s, %o', (torrent.torrent.infoHash.substring(0, 4)), event, args)
    switch (event) {
      case 'pieces-uploaded': {
        const [index, offset] = <[number, number]>args
        this.emit('pieces-uploaded', wire, [index])
        break
      }
      case 'piece': {
        const [index, offset] = <[number, number]>args
        this.emit('pieces-downloaded', wire, [index])
        break
      }
      case 'close': {
        this.emit('disconnected', wire)
        break
      }
      case 'established': {
        this.emit('established', wire)
        break
      }
      case 'bitfield': {
        const [peerPieces] = <[BitField]>args
        const arr: number[] = new Array()
        peerPieces.forEach((b, idx) => {if (b) {arr.push(idx)} })
        this.emit('peer-interested', wire, arr)
        break
      }
      case 'uninterested': {
        this.emit('peer-uninterested', wire)
        break
      }
      default:
        break
    }
    // this.emit(event, torrent, wire)
  }

  allow(wire: Wire, piece_count: number): void {
    wire.ut_sidetalk.topup_pieces(piece_count)
  }
}
