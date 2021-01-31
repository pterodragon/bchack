import {Wire} from "bittorrent-protocol";
import {EventEmitter} from 'events';
import createDebug from 'debug'
import deffered from 'deffered';

const log = createDebug('wx.shaping');

declare type PIECE_ARGS = [index: number, offset: number, buffer: Buffer];

export interface WireShaping {
  on(event: 'no-allowance', listener: ()=>any): this;
  on(event: 'piece', listener: (...args: PIECE_ARGS)=>any): this;
}

export class WireShaping extends EventEmitter {
  #allowance: number = 0;
  #piece: (...args: PIECE_ARGS)=>void; 
  #allowed?: typeof deffered;

  static extend(wire:Wire) {
    const shaping = new WireShaping(wire);
    wire.shaping = shaping;
    return shaping;
  }
  
  private constructor(private readonly wire: Wire) {
    super();

    this.#piece = wire.piece;

    wire.piece = async(...args: PIECE_ARGS) => {
      log('on_piece', args[0], args[1], 'allowance:', this.#allowance);
      while (this.#allowance <= 0) {
        if (!this.#allowed) {
          log('no-allowance');
          this.#allowed = deffered();
          this.emit('no-allowance');
        }
        await this.#allowed.promise;
        this.#allowed = undefined;
      }
      log('piece', args[0], args[1], 'allowance:', this.#allowance);
      this.#allowance -= 1;
      this.#piece.call(wire, ...args);
      this.emit('piece', ...args);
    };

  }

  release() {
    this.wire.piece = this.#piece.bind(this.wire);
    this.#piece = ()=>{};
  }

  allow(topup: number) {
    this.#allowance += topup;
    if (this.#allowed) {
      this.#allowed.resolve();
    }
    else {
      this.#allowed = Promise.resolve(topup);
    }
  }

}


