import {Wire} from "bittorrent-protocol";
import {EventEmitter} from 'events';
import createDebug from 'debug'
import deffered from 'deffered';

const log = createDebug('wx.shaping');

declare type PIECE_ARGS = [index: number, offset: number, buffer: Buffer];

export interface WireShaping {
  on(event: 'no-allowance', listener: ()=>any): this;
}

export class WireShaping extends EventEmitter {
  #allowance: number = 0;
  #piece: (...args: PIECE_ARGS)=>void; 
  #toppedup?: typeof deffered;

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
        if (!this.#toppedup) {
          this.#toppedup = deffered();
          log('no-allowance');
          this.emit('no-allowance');
        }
        await this.#toppedup.promise;
        this.#toppedup = undefined;
      }
      log('piece', args[0], args[1], 'allowance:', this.#allowance);
      this.#allowance -= 1;
      this.#piece.call(wire, ...args);
    };

  }

  release() {
    this.wire.piece = this.#piece.bind(this.wire);
    this.#piece = ()=>{};
  }

  allow(topup: number) {
    this.#allowance += topup;
    if (this.#toppedup) {
      this.#toppedup.resolve();
    }
    else {
      this.#toppedup = Promise.resolve(topup);
    }
  }

}


