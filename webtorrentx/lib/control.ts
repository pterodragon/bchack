import {Wire} from "bittorrent-protocol";
import debug from 'debug'

const log = debug('wx.control');

/**
 * take the control of piece for wire
 * if not calling next(), the wire would not process to next piece
 */
export class WireController {
  #queue = [];
  #piece: (index: number, offset: number, buffer: Buffer)=>void;

  constructor(private readonly wire: Wire) {
    this.#piece = wire.piece.bind(wire);
    wire.piece = (...args) => {
      log('piece', args&&args[0]);
      //@ts-expect-error
      this.#queue.push(args);
      this.next();
    };
  }

  release() {
    this.wire.piece = this.#piece;
    this.#piece = (...args)=>{};
  }

  pause() {
  }

  next() {
    const args = this.#queue.shift()
    log('next', args&&args[0]);
    //@ts-expect-error
    this.#piece(...args);
  }
}
