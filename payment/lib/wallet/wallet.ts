import { ethers, Signer } from "ethers";

export declare interface Wallet {
  on(event: 'login', listener: (walletAddress: string)=>void): this;
  open(): void;

  getAddress(): string;
  getMessageSigner(): Signer
  getConstractSigner(): Signer
  getWeb3Provider(): ethers.providers.Web3Provider; 
}
