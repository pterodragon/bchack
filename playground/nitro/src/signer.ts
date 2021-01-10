import { ethers } from "ethers";
import { Signer } from "@ethersproject/abstract-signer";
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
    // https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_sign
    //return await super.provider.send("eth_sign", [ address.toLowerCase(), hexlify(data) ]);
    //return await web3.eth.sign( address.toLowerCase(), hexlify(data) );
    return await this.signer.provider.send("personal_sign", [ address.toLowerCase(), hexlify(data) ]);
  }
}
