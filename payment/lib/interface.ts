import { BigNumber } from "ethers";

type RequestListener<Payload> = (
  fromAddress: string,
  amount: BigNumber,
  response:()=>Promise<Payload>,
)=>void;

export declare interface PaymentInterface<Payload> {
  on(event: 'received', listener: (address: string, amount: BigNumber)=>void): this;
  on(event: 'requested', listener: RequestListener<Payload>): this;
  on(event: 'handshake', listener: (handshakeId: string, address: string)=>void): this;
  on(event: 'handshakeBack', listener: (handshakeId: string, address: string)=>void): this;
  on(event: 'finalize', listener: ()=>void): this;

  deposit(address: string, amount: BigNumber): Promise<boolean>;
  received(payload: Payload): Promise<any>;
  handshake(id: string, address?: string): Promise<Payload>;
  request(address: string, amount: BigNumber): Promise<Payload>;
  finalize(address: string, remain: BigNumber): Promise<Payload>
  //hasCredit(address: string, amount: string): Promise<boolean>;
}


