/* Import ethereum wallet utilities  */
import { ethers } from "ethers";

require('dotenv').config({ path: __dirname+'/.env' });

/* Set up an ethereum provider connected to our local blockchain */
const provider = ethers.getDefaultProvider('ropsten');
const wallet = new ethers.Wallet(process.env.WALLET_PRIVATE_KEY, provider);

wallet.getBalance().then(b=>console.log(b.toString()));

