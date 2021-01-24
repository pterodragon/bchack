import { ethers, Signer, Wallet as EthWallet } from "ethers";
import { Wallet } from '../lib/wallet';

export class LocalWallet implements Wallet {
  private _provider: ethers.providers.BaseProvider;
  private _signer: Signer;

  constructor(provider: ethers.providers.JsonRpcProvider, privateKey?: string) {
    this._provider = provider;
    const wallet = privateKey || ethers.Wallet.createRandom();
    this._signer = new EthWallet(wallet, provider);
  }

  on(event: 'login', listener: (walletAddress: string)=>void): any {
  }

  open(): void {
  } 

  getMessageSigner(): Signer {
    return this._signer;
  }

  getConstractSigner(): Signer { 
    return this.getMessageSigner(); 
  }

  getProvider() { return this._provider; }

  async getAddress(): Promise<string> { 
    return this._signer.getAddress();
  }
}
