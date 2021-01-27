import {Extension, Wire} from "bittorrent-protocol";
import {EventEmitter} from 'events'
import debug from 'debug';

const log = debug('wx.sidetalk');
const EXTENSION_NAME = "ut_sidetalk";

export interface SidetalkExtension {
  on(event: 'handshake', listener: (peerExtendedHandshake:object)=>any): this;
  on(event: 'message', listener: (msg: object)=>any): this;
}

export class SidetalkExtension extends EventEmitter implements Extension {
  name: string = EXTENSION_NAME

  constructor(protected readonly wire: Wire) {
    super();
  }

  send(obj: object): void { 
    log('send', obj);
    const buf = Buffer.from(JSON.stringify(obj));
    this.wire.extended(this.name, buf);
  }

  //can use wire.sidetalk after calling extend() on it
  static extend(wire: Wire): SidetalkExtension {
    //log('torrent bitfield', [torrent.bitfield]);
    log('use sidetalk');
    //wire.setTimeout(24 * 60 * 60);
    wire.use(SidetalkExtension);
    //workaround: see node_modules/bittorrent-protocol/index.js:373
    wire.peerExtendedMapping[EXTENSION_NAME] = wire._nextExt-1;
    return  wire[EXTENSION_NAME];
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
//Extension class requires a "name" property on the prototype
SidetalkExtension.prototype.name = EXTENSION_NAME;

