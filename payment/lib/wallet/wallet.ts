import { ethers, Signer } from "ethers";

export declare interface Wallet {
  on(event: 'login', listener: (walletAddress: string)=>void): this;
  open(): void;

  getAddress(): string;
  getMessageSigner(): Signer
  getConstractSigner(): Signer
  getProvider(): ethers.providers.BaseProvider; 
}

