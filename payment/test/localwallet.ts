import { ethers, Signer } from "ethers";
import { Wallet } from '../lib/wallet';

export class LocalWallet implements Wallet {
  private _wallet: ethers.Wallet;
  private _address:  string;
  constructor(private readonly _provider: ethers.providers.JsonRpcProvider) {
    this._wallet = ethers.Wallet.createRandom();
  }
  async init() {
    this._address = await this._wallet.getAddress();
  }
  on(event: 'login', listener: (walletAddress: string)=>void): any {}
  open(): void { } getMessageSigner(): Signer { return this._provider.getSigner(this._address); }
  getConstractSigner(): Signer { return this.getMessageSigner(); }
  getProvider() { return this._provider; }
  getAddress(): string { return this._address; }
}
