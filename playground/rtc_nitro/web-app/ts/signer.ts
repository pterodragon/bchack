import { ethers } from "ethers";
import { Signer } from "@ethersproject/abstract-signer";
import { Bytes, hexlify } from "@ethersproject/bytes";
import { toUtf8Bytes } from "@ethersproject/strings";


export class PortisEthSigner {
  public address:string;
  public constructor(
    private readonly signer: Signer
  ) {
    this.address = ""
  }

  public async fetchAddress(): Promise<string>{
    this.address = await this.signer.getAddress();
    return this.address;
  }

  public async signMessage(message: Bytes | string): Promise<string> {
    const data = ((typeof(message) === "string") ? toUtf8Bytes(message): message);
    const address = this.address==""? await this.signer.getAddress() : this.address;
    // https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_sign
    //return await super.provider.send("eth_sign", [ address.toLowerCase(), hexlify(data) ]);
    //return await web3.eth.sign( address.toLowerCase(), hexlify(data) );

    //The eth_personalSign method requires params ordered [message, address].
    const provider:any = this.signer.provider;
    return await provider?.send("personal_sign", [ hexlify(data), address.toLocaleLowerCase() ]);
  }
  
}
