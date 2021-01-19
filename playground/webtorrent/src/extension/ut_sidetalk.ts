import {Extension, Wire} from 'bittorrent-protocol';
import EventEmitter from 'eventemitter3';

export class ut_sidetalk extends EventEmitter implements Extension {
  name: string = "ut_sidetalk"
  private wire: Wire;

  constructor(wire: Wire) {
    super()
    this.wire = wire
    this.wire.on('handshake', (...args) => {console.log('ztest7')})
    this.wire.on('choke', (...args) => {console.log('ztest6')})
    this.wire.on('interested', (...args) => {this.send('ztest10', {'ztest10': 'ztest10'})})
    // this.wire.on('have', (...args) => {console.log('ztest4')})
    // this.wire.on('request', (...args) => {console.log('ztest3')})
    this.wire.on('extended', (...args) => {console.log('ztest2')})
    // this.wire.extendedMapping
  }

  onHandshake(infoHash, peerId, extensions) {
    console.log('ut_sidetalk extension onHandshake')
  }

  onExtendedHandshake(handshake) {
    console.log('ut_sidetalk extension onExtendedHandshake')
  }

  onMessage(buf: Buffer): void {
    console.log('ut_sidetalk extension onMessage')
    const msg = JSON.parse(buf.toString());
    if (msg.tag) {
      this.emit(msg.tag, this.wire, msg.payload)
    }
  }

  send(tag: string, value: object): void {
    console.log('ut_sidetalk extension send')
    const buf = Buffer.from(JSON.stringify(value));
    this.wire.extended(this.name, buf);
  }

  _onPiece(index: number, offset: number, buffer: Buffer) {
    console.log('ut_sidetalk _onPiece', index, offset, buffer)
  }
}

ut_sidetalk.prototype.name = 'ut_sidetalk'
