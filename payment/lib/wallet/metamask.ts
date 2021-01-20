import { EventEmitter } from "events";
import { ethers, Signer } from "ethers";
import Portis from '@portis/web3';
import { Wallet } from './wallet';

declare global {
    interface Window { ethereum: any; }
}

export class MetamaskWallet extends EventEmitter implements Wallet {
  _provider: ethers.providers.Web3Provider;
  _csigner: Signer;
  _signer: Signer;
  _portis: Portis;
  _address: string;

  constructor() {
    super();

    if (!window.ethereum) { throw new Error("metamask plugin is not installed"); }
    window.ethereum.enable().then(() => {
      const provider = this._provider = new ethers.providers.Web3Provider(window.ethereum);
      this._signer = this._csigner = provider.getSigner();
      //@ts-ignore
      if (web3) {
        //@ts-ignore
        this._address = web3.eth.accounts[0];
        this.emit("login", this._address);
      }
    });
  }
  

  open(): void {
    this._portis.showPortis();
  }

  getMessageSigner(): Signer {
    return this._signer;
  }

  getConstractSigner(): Signer {
    return this._csigner;
  }

  getWeb3Provider(): ethers.providers.Web3Provider {
    return this._provider;
  }

  getAddress(): string {
    return this._address;
  }

}

