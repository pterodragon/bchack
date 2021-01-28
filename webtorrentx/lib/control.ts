import {Wire} from "bittorrent-protocol";
import debug from 'debug'

const log = debug('wx.control');

declare type PIECE_ARGS = [index: number, offset: number, buffer: Buffer];

/**
 * take the control of piece for wire
 * if not calling next(), the wire would not process to next piece
 */
export class WireController {
  #queue: PIECE_ARGS[] = [];
  #piece: (...args: PIECE_ARGS)=>void; 
  constructor(private readonly wire: Wire) {
    this.#piece = wire.piece.bind(wire);
    wire.piece = (...args) => {
      log('piece', args&&args[0]);
      this.#queue.push(args);
      this.next();
    };
  }

  release() {
    this.wire.piece = this.#piece;
    this.#piece = (...args)=>{};
  }


  next() {
    const args = this.#queue.shift()
    if (!args) return;
    log('next', args[0]);
    this.#piece(...args);
  }
}
