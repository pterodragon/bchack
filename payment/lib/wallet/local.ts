import { EventEmitter } from "events";
import { ethers, Signer } from "ethers";
import { Wallet } from './wallet';


export class LocalWallet extends EventEmitter implements Wallet {
  _provider: ethers.providers.Web3Provider;
  _wallet: ethers.Wallet;
  _address:  string;

  constructor() {
    super();
    this._wallet = ethers.Wallet.createRandom();
    //@ts-expect-error
    this._provider = new ethers.providers.JsonRpcProvider(
      `http://localhost:${process.env.GANACHE_PORT}`
    );
  }
  
  async init() {
    this._address = await this._wallet.getAddress();
  }

  open(): void {
  }

  getMessageSigner(): Signer {
    return this._wallet;
  }

  getConstractSigner(): Signer {
    return this._wallet;
  }

  getWeb3Provider(): ethers.providers.Web3Provider {
    return this._provider;
  }

  getAddress(): string {
    return this._address;
  }

}

