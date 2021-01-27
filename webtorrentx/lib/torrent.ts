import {Torrent} from 'webtorrent'
import {Wire} from 'bittorrent-protocol';
import debug from 'debug';
import {ut_sidetalk, ut_sidetalk_opts} from './ut_sidetalk';

const log = debug('torrent');

export interface TorrentX extends Torrent {
  a: number;
}

export function extend(base: Torrent): TorrentX {

  base.on('wire', (wire: Wire, addr?: string) => {
    log('use ut_sidetalk');
    wire.use(ut_sidetalk)
    wire.setTimeout(86400000)
    wire.use(ut_sidetalk)
    wire.ut_sidetalk.ut_sidetalk_opts = opts?.ut_sidetalk_opts
    wire.ut_sidetalk.set_cbs(this.client, this)
    wire.ut_sidetalk.onExtendedHandshake = (handshake) => {
      scclient._onTorrentEvent(this, wire, 'established')
    }

    // at start, seeder won't respond to requests
    if (opts?.ut_sidetalk_opts?.is_seeder) {
      wire.ut_sidetalk.wire_paused = true
    }

    // wraps unchoking
    const _unchoke = wire.unchoke
    wire._unchoke_orig = _unchoke
    wire.unchoke = () => {
      if (wire.ut_sidetalk.wire_paused) {
        wire.ut_sidetalk.send('notice', {'msg': 'unchoke denied: pay up!'})
      } else {
        wire._unchoke_orig()
      }
    }

    // wraps piece
    const _piece = wire.piece
    wire._piece_orig = _piece
    wire.piece = (index, offset, buffer) => {
      if (wire.ut_sidetalk.wire_paused) {
        wire.ut_sidetalk.send('notice', {'msg': 'piece denied: pay up!'})
      } else {
        scclient._onTorrentEvent(this, wire, 'pieces-uploaded', index, offset)
        wire._piece_orig(index, offset, buffer)
      }
    }
  });

  return base as TorrentX;
}

