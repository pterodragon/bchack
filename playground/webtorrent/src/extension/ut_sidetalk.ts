import {Extension, Wire} from 'bittorrent-protocol';
import EventEmitter from 'eventemitter3';

export class ut_sidetalk extends EventEmitter implements Extension {
  public name: string = "ut_sidetalk"
  private wire:Wire;

  constructor(wire:Wire) {
    super()
    this.wire = wire
    // this.wire.extendedMapping
  }

  public onMessage(buf: Buffer): void {
    console.log('ut_sidetalk extension onMessage')
    const msg = JSON.parse(buf.toString());
    if (msg.tag) {
      this.emit(msg.tag, this.wire, msg.payload)
    }
  }

  public send(tag: string, value: object): void {
    console.log('ut_sidetalk extension send')
    const buf = Buffer.from(JSON.stringify(value));
    this.wire.extended(this.name, buf);
  }
}

ut_sidetalk.prototype.name = 'ut_sidetalk'
