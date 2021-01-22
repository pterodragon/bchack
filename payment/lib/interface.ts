import { BigNumber } from "ethers";

type RequestListener<Payload> = (
  fromAddress: string,
  amount: BigNumber,
  response:()=>Promise<Payload>,
)=>void;

export declare interface PaymentInterface<Payload, Shake> {
  on(event: 'received', listener: (address: string, amount: BigNumber)=>void): this;
  on(event: 'requested', listener: RequestListener<Payload>): this;
  on(event: 'handshake', listener: (address: string, shake: Shake)=>void): this;
  on(event: 'finalize', listener: ()=>void): this;

  deposit(address: string, amount: BigNumber): Promise<boolean>;
  received(payload: Payload): void;
  handshake(address: string, shake?:Shake): Promise<Payload>;
  request(address: string, amount: BigNumber): Promise<Payload>;
  finalize(address: string, remain: BigNumber): Promise<Payload>
  //hasCredit(address: string, amount: string): Promise<boolean>;
}


