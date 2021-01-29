import {Extension, Wire} from "bittorrent-protocol";
import {EventEmitter} from 'events'
import debug from 'debug';

const log = debug('wx.sidetalk');
const EXTENSION_NAME = "ut_sidetalk";
const EXTENSION_ID = 3;

const utSidetalk = ()=> {
  //Extension class requires a "name" property on the prototype
  WireSidetalk.prototype.name = EXTENSION_NAME;
  return WireSidetalk;
}
export default utSidetalk;

export interface WireSidetalk {
  on(event: 'handshake', listener: (peerExtendedHandshake:object)=>any): this;
  on(event: 'message', listener: (msg: object)=>any): this;
}

export class WireSidetalk extends EventEmitter implements Extension {
  name: string = EXTENSION_NAME

  constructor(protected readonly wire: Wire) {
    super();
  }

  send(obj: object): void { 
    log('send', obj);
    const buf = encode(obj);
    this.wire.extended(this.name, buf);
  }

  /** 
   * can use wire.sidetalk after calling extend() on it
   */
  //TODO: make this async return after extended handshake?
  static async extend(wire: Wire): Promise<WireSidetalk> {
    //log('torrent bitfield', [torrent.bitfield]);
    wire.setTimeout(24 * 60 * 60);
    log('use sidetalk');
    wire.use(utSidetalk());
    //wire.peerExtendedMapping[EXTENSION_NAME] = wire._nextExt - 1;
    const handle = wire[EXTENSION_NAME];

    //wire.extended(0, {m: {[EXTENSION_NAME]: EXTENSION_ID}});
    await new Promise(resolv=>handle.on('handshake', (shake:{m: number})=> {
      //extension registered after handshake
      if (shake.m[EXTENSION_NAME]) resolv(shake);
    }));

    return handle;
  }

  //--------------------------------------------------
  // provide for handy events
  onExtendedHandshake(peerExtendedHandshake:object) {
    this.emit('handshake', peerExtendedHandshake);
  }

  onMessage(buf: Buffer) {
    const msg = JSON.parse(buf.toString());
    this.emit('message', msg);
  }
}

function encode(obj: object) {
  return Buffer.from(JSON.stringify(obj));
}
