import { BigNumber } from "ethers";


export declare interface PaymentInterface<Payload> {
  on(event: 'handshake', listener: (address: string, handshakeId: string)=>void): this;
  on(event: 'handshakeBack', listener: (address: string, handshakeId: string)=>void): this;
  on(event: 'deposited', listener: (address: string, amount: BigNumber)=>void): this;
  on(event: 'received', listener: (address: string, amount: BigNumber)=>void): this;
  on(event: 'requested', listener: (address: string, amount: BigNumber, response:()=>Promise<Payload>)=>void): this;
  on(event: 'finalized', listener: (address: string, log:any)=>void): this;

  deposit(address: string, amount: BigNumber): Promise<Payload>;
  received(payload: Payload): Promise<any>;
  handshake(id: string, address?: string): Promise<Payload>;
  request(address: string, amount: BigNumber): Promise<Payload>;
  finalize(address: string, remain: BigNumber): Promise<Payload>
  //hasCredit(address: string, amount: string): Promise<boolean>;
}


