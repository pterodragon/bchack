import {Wire} from "bittorrent-protocol";
import createDebug from 'debug'

const log = createDebug('wx.undestroyable');


export class WireUndestroyable {
  #destroy: ()=>void;

  static extend(wire:Wire) {
    return wire.undestroyable = new WireUndestroyable(wire);
  }
  
  private constructor(private readonly wire: Wire) {
    this.#destroy = wire.destroy;
    wire.destroy = ()=>{console.log(`${wire.peerId} try destroy()`)};
  }

  release() {
    this.wire.destroy = this.#destroy.bind(this.wire);
  }
}


