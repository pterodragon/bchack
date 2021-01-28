import {Wire} from "bittorrent-protocol";
import createDebug from 'debug'

const log = createDebug('wx.control');

declare type PIECE_ARGS = [index: number, offset: number, buffer: Buffer];

/**
 * take the control of piece for wire
 * if not calling next(), the wire would not process to next piece
 */
export class WireController {
  #queue: PIECE_ARGS[] = [];
  #piece: (...args: PIECE_ARGS)=>void; 
  constructor(private readonly wire: Wire) {
    this.#piece = wire.piece;
    wire.piece = (...args) => {
      log('piece', args&&args[0]);
      this.#queue.push(args);
    };
  }

  release() {
    while (this.next()) {}
    this.wire.piece = this.#piece.bind(this.wire);
    this.#piece = (...args)=>log('pausing');
  }

  next() {
    const args = this.#queue.shift();
    if (!args) return false;
    this.#piece.call(this.wire, ...args);
    return true;
  }

}


