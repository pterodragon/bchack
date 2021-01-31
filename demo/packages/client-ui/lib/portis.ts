import { EventEmitter } from "events";
import { ethers, Signer } from "ethers";
import Portis from '@portis/web3';
import createDebug from 'debug';
import { Wallet } from 'payment-statechannel';

const log = createDebug('pm.wallet.portis');

export class PortisWallet extends EventEmitter implements Wallet {
  private _provider: ethers.providers.Web3Provider;
  private _csigner: Signer;
  private _signer: Signer;
  private _portis: Portis;
  private _address: Promise<string>;

  constructor(dappAddress: string, network: string) {
    super();
    const portis = this._portis = new Portis(dappAddress, network);
    this._provider = new ethers.providers.Web3Provider(portis.provider);
    this._csigner = this._provider.getSigner();
    //@ts-ignore
    this._signer = new PortisEthSigner(this._csigner);
    this._address = new Promise(resolv=>
      portis.onLogin((walletAddress) => {
        this.emit("login", walletAddress);
        log('login', walletAddress);
        resolv(walletAddress);
      })
    );
  }
  

  open(): void {
    this._portis.showPortis();
  }

  getSigner(): Signer {
    return this._signer;
  }

  getConstractSigner(): Signer {
    return this._csigner;
  }

  getProvider(): ethers.providers.BaseProvider {
    return this._provider;
  }

  getAddress(): Promise<string> {
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

