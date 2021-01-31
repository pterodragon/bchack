import {Wire} from "bittorrent-protocol";
import {EventEmitter} from 'events';
import createDebug from 'debug'

const log = createDebug('wx.control');

declare type PIECE_ARGS = [index: number, offset: number, buffer: Buffer];

export interface WireControl {
  on(event: 'piece', listener: (...args: PIECE_ARGS)=>any): this;
}

/**
 * take the control of piece for wire
 * if not calling next(), the wire would not process to next piece
 */
export class WireControl extends EventEmitter {
  #queue: PIECE_ARGS[] = [];
  #piece: (...args: PIECE_ARGS)=>void; 

  static extend(wire:Wire) {
    const control = new WireControl(wire);
    wire.control = control;
    return control;
  }
  
  private constructor(private readonly wire: Wire) {
    super();
    this.#piece = wire.piece;
    wire.piece = (...args) => {
      log('piece', args&&args[0]);
      this.#queue.push(args);
      this.emit('piece', ...args);
    };
  }

  release() {
    while (this.next()) {}
    this.wire.piece = this.#piece.bind(this.wire);
    this.#piece = (...args)=>log('pausing');
  }

  next() {
    const args = this.#queue.shift();
    log('next piece', args&&args[0]);
    if (!args) return false;
    this.#piece.call(this.wire, ...args);
    return true;
  }

}


