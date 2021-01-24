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
    this.webtorrent = new WebTorrent(),
    this.extorrent_opts = extorrent_opts || {}
  }

  seed(input, opts, onseed): ExTorrent {
    logger.info('SCClient seed: %s', input)
    return new ExTorrent(this.webtorrent.seed(input, opts, onseed), this, this.extorrent_opts)
  }

  add(torrentId, opts = {}, ontorrent = () => {}): ExTorrent {
    logger.info('SCClient add: %s', torrentId)
    return new ExTorrent(this.webtorrent.add(torrentId, opts, ontorrent), this)
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
      case 'wire': {
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
    this.emit(event, torrent, wire)
  }

  allow(wire: Wire, piece_count: number): void {
    wire.ut_sidetalk.topup_pieces(piece_count)
  }
}