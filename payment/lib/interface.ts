import { BigNumber } from "ethers";


export declare interface PaymentInterface<Payload> {
  on(event: 'handshake', listener: (address: string, handshakeId: string)=>void): this;
  on(event: 'handshakeBack', listener: (address: string, handshakeId: string, channelId: string, expected?:BigNumber)=>void): this;
  on(event: 'deposited', listener: (address: string, amount: BigNumber)=>void): this;
  on(event: 'received', listener: (address: string, amount: BigNumber, requestId?:string)=>void): this;
  on(event: 'requested', listener: (address: string, amount: BigNumber, respond:()=>Promise<Payload>)=>void): this;
  on(event: 'finalized', listener: (address: string, log:any)=>void): this;

  deposit(address: string, amount: BigNumber): Promise<Payload>;
  received(payload: Payload, meta?: any): Promise<any>;
  handshake(id: string, address?: string, expected?: BigNumber): Promise<Payload>;
  request(address: string, amount: BigNumber, requestId?: string): Promise<Payload>;
  finalize(address: string): Promise<Payload>
  //hasCredit(address: string, amount: string): Promise<boolean>;
}


