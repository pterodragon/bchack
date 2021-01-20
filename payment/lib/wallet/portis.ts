import { EventEmitter } from "events";
import { ethers, Signer } from "ethers";
import Portis from '@portis/web3';
import { Wallet } from './wallet';

export class PortisWallet extends EventEmitter implements Wallet {
  _provider: ethers.providers.Web3Provider;
  _csigner: Signer;
  _signer: Signer;
  _portis: Portis;
  _address: string;

  constructor(dappAddress: string, network: string) {
    super();
    const portis = this._portis = new Portis(dappAddress, network);
    this._provider = new ethers.providers.Web3Provider(portis.provider);
    this._csigner = this._provider.getSigner();
    //@ts-ignore
    this._signer = new PortisEthSigner(this._csigner);
    
    portis.onLogin((walletAddress) => {
      this._address = walletAddress;
      this.emit("login", walletAddress);
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


import { Bytes, hexlify } from "@ethersproject/bytes";
import { toUtf8Bytes } from "@ethersproject/strings";

export class PortisEthSigner {

  public constructor(
    private readonly signer: Signer
  ) {
  }

  public async signMessage(message: Bytes | string): Promise<string> {
    const data = ((typeof(message) === "string") ? toUtf8Bytes(message): message);
    const address = await this.signer.getAddress();
    //The eth_personalSign method requires params ordered [message, address].
    //@ts-ignore
    return await this.signer.provider.send("personal_sign", [ hexlify(data), address.toLowerCase() ]);
  }
}

