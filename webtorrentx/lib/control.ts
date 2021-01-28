import {Wire} from "bittorrent-protocol";
import createDebug from 'debug'

const debug = createDebug('wx.control');
const DUMMY = (...args)=>debug('pausing');

type Piece = (index: number, offset: number, buffer: Buffer) => void;

export class WireControl {
  #piece: Piece;
  #queue: [number, number, Buffer][] = [];

  constructor(private readonly wire: Wire) {
    this.#piece = wire.piece;
    wire.piece = (...arg) => {
      this.#queue.push(arg);
    };
  }

  next() {
    const args = this.#queue.shift();
    if (!args) return false;
    this.#piece.call(this.wire, ...args);
    return true;
  }

  release() {
    while (this.next()) {}
    this.wire.piece = this.#piece.bind(this.wire);
    this.#piece = DUMMY;
  }


}


