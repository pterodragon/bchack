import { EventEmitter } from "events";
import { ethers, Signer } from "ethers";
import { Wallet } from './wallet';

declare global {
    interface Window { ethereum: any; }
}

export class MetamaskWallet extends EventEmitter implements Wallet {
  private _provider: ethers.providers.Web3Provider;
  private _signer: Signer;
  private _address: Promise<string>;

  constructor() {
    super();

    if (!window.ethereum) { 
      throw new Error("metamask plugin is not installed"); 
    }
    this._address = (async() => {
      await window.ethereum.enable();
      console.log('ethereum', window.ethereum);
      const provider = this._provider = new ethers.providers.Web3Provider(window.ethereum);
      this._signer = provider.getSigner();
      const address = window.ethereum.selectedAddress;
      this.emit("login", address);
      return address;
  })();

  }
  
  open(): void {
    this.getAddress();
  }

  getSigner(): Signer {
    return this._signer;
  }

  getConstractSigner(): Signer {
    return this._signer;
  }

  getProvider(): ethers.providers.BaseProvider {
    return this._provider;
  }

  async getAddress(): Promise<string> {
    return this._address;
  }

}

