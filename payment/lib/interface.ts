import { BigNumber } from "ethers";


/**
 * usage:
 * Whel receive a payload, call received(), it would trigger the events.
 * On handshake event, call handshake() back with the received shake.
 *
 * When the seeder want to request eth form leecher1,
 * first call handshake(), and send the returned payload to leecher1.
 * Then, call request() to get a Payload object and send
 * it alongside with the peice.
 *
 * Then leecher can transfer eth to seeder by calling transfer(), 
 * get a new payload the send it back to the seeder;
 */
export declare interface PaymentInterface<Payload, Shake> {
  on(event: 'transferred', listener: (address: string, amount: BigNumber)=>void): this;
  on(event: 'requested', listener: (address: string, amount: BigNumber)=>void): this;
  on(event: 'handshake', listener: (address: string, shake: Shake)=>void): this;

  handshake(shake?:Shake): Promise<Payload>;
  transfer(address: string, amount: BigNumber): Promise<Payload>;
  request(address: string, amount: BigNumber): Promise<Payload>;
  received(payload: Payload): void;
  finalize(src: string, dest: string): Promise<void>
  hasCredit(address: string, amount: string): Promise<boolean>;
  topUp(address: string, amount: BigNumber): Promise<boolean>;
}


