import Torrent from 'webtorrent/lib/torrent'
import {ut_sidetalk} from '../extension/ut_sidetalk'
import {Wire} from 'bittorrent-protocol';

export class ExTorrent {
  torrent: Torrent

  constructor(torrent: Torrent) {
    // using composition as typescript inheritance fucked with me
    this.torrent = torrent
    this.torrent.on('wire', this._onWire)
  }

  _onWire(wire: Wire, addr) {
    wire.use(ut_sidetalk)
  }
}
