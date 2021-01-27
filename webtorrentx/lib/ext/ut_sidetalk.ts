import {Extension, Wire} from 'bittorrent-protocol'
import {EventEmitter} from 'events'
import debug from 'debug';

const log = debug('ut_sidetalk');

export interface ut_sidetalk_opts {
  is_seeder?: boolean
  is_leecher?: boolean
}


export class ut_sidetalk extends EventEmitter implements Extension {
  name: string = "ut_sidetalk"
  private wire: Wire
  private _wire_paused = false
  private _opts?: ut_sidetalk_opts
  private _allowed_pieces = 0

  get wire_paused(): boolean {
    return this._wire_paused
  }
  set wire_paused(b: boolean) {
    this._wire_paused = b
  }

  consume_pieces(n: number) {
    this._allowed_pieces -= n
    this._set_pause_status()
  }

  topup_pieces(n: number) {
    this._allowed_pieces += n
    this._set_pause_status()
  }

  private _set_pause_status() {
    this.wire_paused = this._allowed_pieces <= 0
    if (this.wire_paused) {
      this.wire.choke()
    } else {
      this.wire._unchoke_orig()
    }
  }

  set_cbs(scclient: SCClient, torrent: ExTorrent) : void {
    this.wire.on('handshake', (...args) => {
      log('handshake')
    })
    this.wire.on('choke', () => {
    })
    this.wire.on('timeout', () => {
      scclient._onTorrentEvent(torrent, this.wire, 'timeout')
    })
    this.wire.on('close', () => {
      scclient._onTorrentEvent(torrent, this.wire, 'close')
    })
    this.wire.on('have', (index) => {
      scclient._onTorrentEvent(torrent, this.wire, 'have', index)
    })
    this.wire.on('upload', (buf_len) => {
      // served a piece
      this.consume_pieces(1)
      // wrapped `piece` method
      // scclient._onTorrentEvent(torrent, this.wire, 'upload', buf_len)
    })
    this.wire.on('interested', () => {
      scclient._onTorrentEvent(torrent, this.wire, 'interested')
    })
    this.wire.on('uninterested', () => {
      scclient._onTorrentEvent(torrent, this.wire, 'uninterested')
    })
    this.wire.on('request', (index, offset, length, cb) => {
      scclient._onTorrentEvent(torrent, this.wire, 'request', index, offset, length, cb)
    })
    this.wire.on('extended', (ext, buf) => {
    })
    this.wire.on('piece', (index, offset, buffer) => {
      scclient._onTorrentEvent(torrent, this.wire, 'piece', index, offset)
    })
    this.wire.on('bitfield', (peerPieces) => {
      scclient._onTorrentEvent(torrent, this.wire, 'bitfield', peerPieces)
    })
  }

  constructor(wire: Wire) {
    super()
    this.wire = wire
  }

  // onHandshake(infoHash, peerId, extensions) {
  //   logger.info('ut_sidetalk onHandshake')
  // }

  // onExtendedHandshake(handshake) {
  //   logger.info('ut_sidetalk onExtendedHandshake')
  // }

  onMessage(buf: Buffer): void {
    const msg = JSON.parse(buf.toString())
    log('ut_sidetalk onMessage:', msg)
    if (msg.tag) {
      this.emit(msg.tag, this.wire, msg.payload)
      if (msg.tag == 'topup') {
        this.topup_pieces(100)
      }
    }
  }

  send(tag: string, value: object): void {
    value['tag'] = tag
    log('ut_sidetalk send', tag, value);
    const buf = Buffer.from(JSON.stringify(value))
    this.wire.extended(this.name, buf)
  }

  set ut_sidetalk_opts(opts: ut_sidetalk_opts) {
    this._opts = opts
  }
}

ut_sidetalk.prototype.name = 'ut_sidetalk'
