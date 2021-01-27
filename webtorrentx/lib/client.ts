import WebTorrent, {Torrent, TorrentOptions} from 'webtorrent';
import {ut_control} from './ut_control'
import {Wire} from 'bittorrent-protocol';
import BitField from 'bitfield'
import debug from 'debug';
import {TorrentX, extend} from './torrent';

const log = debug('webtorrent');

export interface TorrentOptionsX extends TorrentOptions {
}

export default class WebTorrentX extends WebTorrent {
  constructor() {
    super();
  }

  async addx(uri: string, opts?: TorrentOptionsX): Promise<TorrentX> {
    log('add', uri);
    const torrent: Torrent = await new Promise(resolv=>super.add(uri, opts, resolv));
    return extend(torrent);
  }

  async seedx(uri: string, opts?: TorrentOptions): Promise<TorrentX> {
    log('seed', uri);
    const torrent: Torrent = await new Promise(resolv=>super.seed(uri, opts, resolv));
    return extend(torrent);
  }
  
  /*
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
  */
}
