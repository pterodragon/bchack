import {Wire} from 'bittorrent-protocol';
import {WireShaping} from '../lib/shaping';
import {mock} from 'jest-mock-extended';


describe("Wire Shapping", function() {
  const wire = mock<Wire>();
  const origPiece = wire.piece;
  const buffer = {} as Buffer;
  const shaping = WireShaping.extend(wire);

  beforeAll(()=> {
    expect(origPiece===wire.piece).toBeFalsy();
  });

  afterEach(()=> {
    shaping.removeAllListeners();
  });

  it("no-allowance is called initially since allowance=0", ()=> {
    let onNoAllowance = 0;
    shaping.on('no-allowance', ()=> {
      expect(onNoAllowance).toBe(0);
      onNoAllowance += 1;
    });

    for (let i=0; i<10; ++i) {
      wire.piece(i, 0, buffer);
    }

    expect(origPiece).toHaveBeenCalledTimes(0);
  });

  it("allow 5", async()=> {
    const ALLOWED = 5;
    shaping.allow(ALLOWED);
    const promises: Promise<any>[] = []
    for (let i=0; i<ALLOWED; ++i) {
      promises.push(new Promise(resolv=>shaping.once('piece', resolv)));
    }

    const indices = (await Promise.all(promises)).sort();
    console.log(indices);
    for (let i=0; i<ALLOWED; ++i) {
      expect(indices[i]).toBe(i);
    }

    expect(origPiece).toHaveBeenCalledTimes(ALLOWED);
  });

});
