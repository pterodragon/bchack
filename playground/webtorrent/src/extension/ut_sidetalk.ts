import {Extension, Wire} from 'bittorrent-protocol'
import EventEmitter from 'eventemitter3'
import {logger} from '../lib/logger'


export interface ut_sidetalk_opts {
  is_seeder?: boolean
  is_leecher?: boolean
}


export class ut_sidetalk extends EventEmitter implements Extension {
  name: string = "ut_sidetalk"
  private wire: Wire
  private _wire_paused: boolean = false

  get wire_paused(): boolean {
    return this._wire_paused
  }
  set wire_paused(b: boolean) {
    this._wire_paused = b
  }

  constructor(wire: Wire, opts?: ut_sidetalk_opts) {
    super()
    this.wire = wire
    this.wire.on('handshake', (...args) => {
      logger.debug('handshake')
    })
    this.wire.on('choke', (...args) => {
      logger.debug('choke')
    })
    this.wire.on('interested', (...args) => {
      logger.debug('interested')
      this.send('ztest10', {'ztest10': 'ztest10'})
    })
    this.wire.on('request', (...args) => {
      logger.debug('request')
    })
    this.wire.on('extended', (ext, buf) => {
      logger.debug('extended')
    })
    this.wire.on('piece', (...args) => {
      logger.debug('piece')
    })
  }

  onHandshake(infoHash, peerId, extensions) {
    logger.info('ut_sidetalk onHandshake')
  }

  onExtendedHandshake(handshake) {
    logger.info('ut_sidetalk onExtendedHandshake')
  }

  onMessage(buf: Buffer): void {
    const msg = JSON.parse(buf.toString())
    logger.debug('ut_sidetalk onMessage: %o', msg)
    if (msg.tag) {
      this.emit(msg.tag, this.wire, msg.payload)
    }
  }

  send(tag: string, value: object): void {
    logger.debug('ut_sidetalk send (%s, %o)', tag, value)
    const buf = Buffer.from(JSON.stringify(value))
    this.wire.extended(this.name, buf)
  }

  set_opts(opts: ut_sidetalk_opts): void {
  }
}

ut_sidetalk.prototype.name = 'ut_sidetalk'
