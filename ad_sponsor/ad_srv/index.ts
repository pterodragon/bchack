import express from 'express';
import http from 'http';
import {Server, Socket} from "socket.io"
import {BigNumber, ethers} from 'ethers'
import {ContractArtifacts, getDepositedEvent} from '@statechannels/nitro-protocol'
import path from 'path'
import {promises as fs} from 'fs'

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 8080;
const ethAssetAddress = process.env.ETH_ASSET_ADDRESS || '0x0c21F09C4fA08D521091F8d22F79f15E52DDd610';
const assetDir = process.env.ASSET_DIR || './public';
const chainNetwork = process.env.CHAIN_NETWORK || "goerli";
const privateKey = process.env.PRIVATE_KEY || "0x016b95b668740458890eaaecb6d7dbd294cf97e9aed2dff056bbd8e4c87a17db";


const provider = new ethers.providers.InfuraWebSocketProvider(chainNetwork, '420442cd37d34b55b17878e4384ed932');
const signer = new ethers.Wallet(privateKey, provider);
let ads:string[] = [];

app.use(express.static(assetDir));

const EthAssetHolder = new ethers.Contract(
  ethAssetAddress,
  ContractArtifacts.EthAssetHolderArtifact.abi,
  signer
);

server.listen(port, async()=>{
  ads = await fs.readdir(assetDir).then(files=>files.filter(f=>f.endsWith(".mp4")));
});

let io = new Server(server, {
  cors:{
      origin: "*"
  }
});

interface BigNumberALike{
  hex: string;
  type: 'BigNumber';
}

function uuid4(): string{
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c):string => {
      var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
  });
}

io.on("connection", (socket: Socket)=>{
  console.log("Now serving: ", socket.id);

  socket.on('request-ad', (destination: string, amount: BigNumberALike, expectedHeld: BigNumberALike)=>{
    if(ads.length==0){
      socket.emit('ad-error', {msg: 'No ad on server'});
      return;
    }
    const adId = uuid4();
    const amountHexable = BigNumber.from(amount);
    const expectedHeldHexable = BigNumber.from(expectedHeld);
    socket.on('ad-completed', async (id: string)=>{
      console.log("Ad-id: ", adId);
      console.log("Requested: ", amountHexable);
      if(adId!=id) { 
        console.log("Unmatched ad-id. Expecting ", adId, ", got: ", id);
        return;
      }
      const tx = EthAssetHolder.deposit(ethers.utils.hexZeroPad(destination, 32), expectedHeldHexable, amountHexable, {
        value: amountHexable
      });

      const { events } = await (await tx).wait();
      const depositedEvent = getDepositedEvent(events);
      console.log("deposited, ", depositedEvent);
      socket.emit('completed', {id:adId, destination: destination, amount: amount, details: depositedEvent});
    })
    socket.emit('ad-ready', {path: ads[0], id:adId});    
  })
});