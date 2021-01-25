
import 'regenerator-runtime/runtime';

import Portis from '@portis/web3';
import Web3 from 'web3';

import { ethers, Wallet } from "ethers";

import {
  ContractArtifacts,
  SignedState,
} from "@statechannels/nitro-protocol";

import { Peer, DataRTC} from "./rtcdc"
import { Dispatcher } from  "./dispatcher"
import { FullConsensusChannel } from './channel';
import { PromptInputSpec, promptUser } from './html-ui'
import { parseUnits } from 'ethers/lib/utils';

import { PortisEthSigner } from './signer'

const portis = new Portis('95629333-653a-4532-af54-ef64b586d2a5', 'goerli');
const web3 = new Web3(portis.provider);
const provider = new ethers.providers.Web3Provider(portis.provider);

const signalingUrl = "ws://127.0.0.1:8086/"
const dataRTC = new DataRTC();

const chainId = '0x05';

//WebRTC transmit only member values, not prototype methods
declare interface BigNumberAlike{
  hex: string;
  type: 'BigNumber';
}

interface Action{
  action: 'prefund' | 'postfund' | 'transaction' | 'finalize';
  transactions?: {payer: string, payee: string, amount: string, unit: string}[];
}

interface ChannelExchange{
  on(event: 'wallet-query', listener: (senderId: string)=>void ): this;
  on(event: 'wallet-reply', listener: (senderId: string, wallet: {address: string})=>void ): this;
  on(event: 'channel-invite', listener: (senderId: string, channel: {participants: string[], nonce: number, channelId: string})=>void ): this;
  on(event: 'channel-join', listener: (senderId: string, response:{channelId: string, senderDepose: BigNumberAlike})=> void) : this;
  on(event: 'channel-create', listener: (senderId: string, channel: {channelId: string, participants: string[], amounts: BigNumberAlike[], nonce: number})=>void): this;
  on(event: 'state-transit', listener: (senderId: string, transit:{channelId: string, action: Action, next: SignedState})=>void): this;
  on(event: 'state-consense', listener: (senderId: string, response:{channelId: string, signed: SignedState})=>void): this;
  on(event: 'channel-closed', listener: (senderId: string, channelId: string)=>void): this;

  send(peer:Peer, event: 'wallet-query'): this;
  send(peer:Peer, event: 'wallet-reply', wallet: {address: string} ): this;
  send(peer:Peer, event: 'channel-invite', channel: {participants: string[], nonce: number, channelId: string} ): this;
  send(peer:Peer, event: 'channel-join', response:{channelId: string, senderDepose: BigNumberAlike | ethers.BigNumber}) : this;
  send(peer:Peer, event: 'channel-create', channel: {channelId: string, participants: string[], amounts: (BigNumberAlike | ethers.BigNumber)[], nonce: number}): this;
  send(peer:Peer, event: 'state-transit', transit:{channelId: string, action: Action, next: SignedState}): this;
  send(peer:Peer, event: 'state-consense', response:{channelId: string, signed: SignedState}): this;
  send(peer:Peer, event: 'channel-closed', channelId: string): this;
}

class ChannelExchange extends Dispatcher{
  constructor(){
    super();
  }
}
const dispatcher = new ChannelExchange();

declare interface EthPeer{
  wiring: Peer;
  walletAddress?: string;
}

const ethPeersById: Map<string, EthPeer> = new Map();

class EthAccount{
  public account: string = ethers.constants.AddressZero;
  public balance: string = ethers.constants.Zero.toString();
  public signer?: Wallet;
}

interface ChannelMetaInfo{
  participants: string[];
  deposit: ethers.BigNumber[];
  nonce: number;
  status: 'funding' | 'awaiting-consense' | 'consensed' | 'closed';
}

const myEthAccount = new EthAccount();
const channels: Map<string, FullConsensusChannel> = new Map();
const channelsMeta: Map<string, ChannelMetaInfo> = new Map();

function isMyId(peerId: string): boolean{
  return peerId == dataRTC.myId;
}

function getWalletAddress(peerId: string, nonExistent: string = ethers.constants.AddressZero): string{
  const addr = isMyId(peerId)? myEthAccount.account : ethPeersById.get(peerId)?.walletAddress;
  return addr || nonExistent;
}

dataRTC.onPeerConnected = (peer: Peer) => {
  let ethPeer = ethPeersById.get(peer.id);
  if(ethPeer){
    ethPeer.wiring = peer;
  }else{
    if(!peer.channel){
      console.error("Channel not found in peer")
      return;
    }
    peer.channel.onmessage = dispatcher.getMessageListener()
    ethPeersById.set(peer.id, {wiring: peer});
    dispatcher.send(peer, "wallet-query");
  }
}

dataRTC.onPeerListUpdated = (peers: Peer[]) => {
  peers.forEach(peer=>{
    dataRTC.connect(peer);
  });
}

/**
 * Query peer wallet address
 */
dispatcher.on("wallet-query", (senderId: string)=>{
  const peer = ethPeersById.get(senderId);
  if(peer){
    dispatcher.send(peer.wiring, "wallet-reply", {address: myEthAccount.account})
  }
})
/**
 * Response peer wallet address query
 */
dispatcher.on("wallet-reply", (senderId: string, wallet: any)=>{
  const peer = ethPeersById.get(senderId);
  if(peer){
    peer.walletAddress = wallet.address;
    updatePeersUI();
  };
})
/**
 * Sender send a invitation to join a channel
 * Invitee determine and store the fund he going to depose on the channel
 */
dispatcher.on("channel-invite", (senderId:string, channel:{participants:string[], nonce:number, channelId: string})=>{
  const peer = ethPeersById.get(senderId);
  let description = `Channel Invitation from ${senderId}. Channel ID: ${channel.channelId}, Nonce: ${channel.nonce}<br/>\n`
  description += "Participants: " + channel.participants.reduce((a, p)=>a+=`${p}, `, "");
  description += "<br/> Accept?";
  promptUser(description, [{type: 'number', value:0, text:'Depose'}, {type: 'select', value:['wei', 'gwei'], text: 'Unit'}], (response: boolean, inputs:any[])=>{
    if(response && peer?.wiring){
      const channelId = channel.channelId;
      const senderDepose = parseUnits(inputs[0], inputs[1]);
      const deposit = Array(channel.participants.length);
      deposit[channel.participants.findIndex(p=>p==dataRTC.myId)] = senderDepose;
      const unit = "wei";
      channelsMeta.set(channel.channelId, {participants: channel.participants, deposit: deposit, nonce: channel.nonce, status: 'funding'});
      dispatcher.send(peer?.wiring, 'channel-join', {channelId, senderDepose});
    }else{
      console.log("Silently ignoring invite.");
    }
  });
})
/**
 * Received join response from invitee with their intended amount to deposit on the channel
 * Once all responses are received, send each participant the final allocation to begin state exchange
 */
dispatcher.on('channel-join', async (senderId: string, response:{channelId: string, senderDepose: BigNumberAlike})=>{
  const channelData = channelsMeta.get(response.channelId);
  const channel = channels.get(response.channelId);
  if(!channelData || !channel){
    console.warn("Silently dropping unknown channel-join. ", response.channelId);
    return;
  }
  channelData.deposit[channelData.participants.findIndex(p=>p==senderId)] = ethers.BigNumber.from(response.senderDepose);

  if(channelData.deposit.findIndex(d=>d===ethers.constants.NegativeOne)<0){  //Received channel-join from all participants
    const channelId = response.channelId;
    const participants = channelData.participants;
    const amounts = channelData.deposit;
    const nonce = channelData.nonce;

    const flow = channel.beginFunding();
    flow.on('depositReady', ()=>{
      console.log("DepositReady");
      flow.deposit()
      .then(signed=>{
        boardcastState(signed, channelId, {action: 'postfund'}, participants);
      });
    })
    .on('fundingCompleted', ()=>{
      console.log("funding ready");
      channelData.status = 'consensed';
      updateChannelUI();
    })
    const signed = await flow.propose(amounts);
    
    channelData.participants.forEach((p, i)=>{
      const peer = ethPeersById.get(p)?.wiring;
      if(p!=dataRTC.myId && peer){
        dispatcher.send(peer, 'channel-create', {channelId, participants, amounts, nonce})
      }
    });
    boardcastState(signed, channelId, {action: 'prefund'}, participants);
  }
})
/**
 * 
 */
dispatcher.on('channel-create', async (senderId: string, channel:{channelId: string, participants: string[], amounts: BigNumberAlike[], nonce:number})=>{
  const channelData = channelsMeta.get(channel.channelId);
  if(!channelData){
    console.warn("Silently dropping unknown channel-join. ", channel.channelId);
    return;
  }
  //Copy others' allocation
  channel.amounts.forEach((amount, i)=>{
    if(channel.participants[i]==dataRTC.myId) return;
    channelData.deposit[i] = ethers.BigNumber.from(amount);
  });
  console.log(`Channel-create: Participants:${channel.participants}\n Deposits: ${channelData.deposit}\n Meta: ${channelData}`)
  const created = createChannel(channel.channelId, channel.participants, channelData.deposit, channel.nonce);
  if(created){
    const flow = created.beginFunding();
    flow.on('depositReady', ()=>{
      console.log("DepositReady");
      flow.deposit()
      .then(signed=>{
        boardcastState(signed, channel.channelId, {action: 'postfund'}, channelData.participants);
      });
    })
    .on('fundingCompleted', ()=>{
      console.log("funding ready");
      channelData.status = 'consensed';
      updateChannelUI();
    })
    const signed = await flow.propose(channelData.deposit);
    boardcastState(signed, channel.channelId, {action: 'prefund'}, channelData.participants);
  }
})
dispatcher.on('state-transit', async (senderId: string, transit:{channelId:string, action:Action, next: SignedState})=>{
  const channel = channels.get(transit.channelId);
  const channelMeta = channelsMeta.get(transit.channelId);
  const address = getWalletAddress(senderId);
  if(!channel || !channelMeta){
    console.error("Channel not found: ", transit.channelId);
    return;
  }
  if(!address){
    console.error("User unknown: ", senderId);
    return;
  }
  
  if(transit.action.action == 'finalize'){
    channel.on('closed', (channel, outcome)=>{
      channelMeta.status = 'closed';
      updateChannelUI();
      channelMeta.participants.forEach(p=>{
        const peer = ethPeersById.get(p);
        if(peer){
          dispatcher.send(peer.wiring, 'channel-closed', channel.channelId);
        }
      })
    })
    const result = await channel.finalize();
    if(result.submitTo != channel.myTurn){
      const peerId = channelsMeta.get(channel.channelId)?.participants[result.submitTo]
      if(peerId){
        const wiring = ethPeersById.get(peerId)?.wiring;
        if(wiring){
          dispatcher.send(wiring, 'state-consense', {channelId: channel.channelId, signed: result.state});
        }
      }else{
        console.error(`peer id not found for ${result.submitTo}`);
      }
    }
  }
  await channel.onStateReceived(transit.next, channel.getParticipantIndex(address));
  if(transit.action.action == 'transaction'){
    let text = `${senderId} propose to make payment: <br/>`;
    transit.action.transactions?.forEach(t=>{
      text += `${t.payer} ==${t.amount} ${t.unit}==> ${t.payee} <br/>`;
    });
    const getPeerIndex = (peerId:string): number=>channel.getParticipantIndex(getWalletAddress(peerId));

    promptUser(text, [], (response)=>{
      if(response){
        if(transit.action.transactions){
          channel.transfer(transit.action.transactions.map(t=>{return {payer: getPeerIndex(t.payer), payee: getPeerIndex(t.payee), amount: t.amount, unit: t.unit}}))
          .then((signed)=>{
            channelMeta.participants.map(p=>{
              const peer = ethPeersById.get(p);
              if(peer){
                dispatcher.send(peer.wiring, "state-consense", {channelId: channel.channelId, signed: signed});
              }
            })
          })
        }
      }
    })
  }
  
});
dispatcher.on('state-consense', (senderId:string, response:{channelId: string, signed: SignedState})=>{
  const walletAddress = ethPeersById.get(senderId)?.walletAddress;
  const channel = channels.get(response.channelId);
  if(walletAddress && channel){
    channel.onStateReceived(response.signed, channel.getParticipantIndex(walletAddress));
  }
});
dispatcher.on('channel-closed', (senderId: string, channelId: string)=>{
  const meta = channelsMeta.get(channelId);
  if(meta){
    meta.status = 'closed';
    updateChannelUI();
  }
})

function boardcastState(signedState: SignedState, channelId: string, action: Action, participants: string[]){
  participants.forEach(p=>{
    if(p==dataRTC.myId) return;
    const peer = ethPeersById.get(p);
    if(peer){
      dispatcher.send(peer.wiring, 'state-transit', {channelId, action, next: signedState});
    }
  })
}

function createChannel(channelId: string, participants: string[], amounts: ethers.BigNumber[], nonce: number): FullConsensusChannel | undefined{
  const wallets = participants.map(p=>getWalletAddress(p));
  const myIndex = participants.findIndex(p=>p==dataRTC.myId);
  const channelSpec = channelsMeta.get(channelId);
  const myDeposit = channelSpec?.deposit;
  if(!myDeposit || !myDeposit[myIndex]){
    console.warn("Channel not found/not agreed: ", channelId);
    return;
  }
  if(!amounts[myIndex].eq(myDeposit[myIndex])){
    console.error(`Unmatched deposit. Expected: ${myDeposit[myIndex]}, Received: ${amounts[myIndex]}`);
    return;
  }
  if(!myEthAccount.signer){
    console.error("Missing wallet signer");
    return
  }
  const channel = new FullConsensusChannel(myEthAccount.signer, wallets, chainId, nonce);

  channel.on('consensed', (channel, outcome)=>{
    console.log(`${channel.channelId} reached consense on outcome: \n${outcome.map((v, i)=>`${i}: ${v.toString()}\n`)}`);
    const channelMeta = channelsMeta.get(channel.channelId);
    if(channelMeta && channel.funding?.isFunded){
      channelMeta.status = 'consensed';
    }
    updateChannelUI();
  })
  channels.set(channelId, channel);
  return channel;
}

function initiateChannel(participants: string[], myDeposit: string, unit: string, nonce?: number){
  if(!myEthAccount.signer){
    console.error("Missing wallet signer");
    return
  }
  const wallets = participants.map(p=>getWalletAddress(p)); 
  nonce = nonce || Date.now()
  const channel = new FullConsensusChannel(myEthAccount.signer, wallets, chainId, nonce);
  channel.on('consensed', (channel, outcome)=>{
    console.log(`${channel.channelId} reached consense on outcome: \n${outcome.map((v, i)=>`${i}: ${v.toString()}\n`)}`);
    const channelMeta = channelsMeta.get(channel.channelId);
    if(channelMeta && channel.funding?.isFunded){
      channelMeta.status = 'consensed';
    }
    updateChannelUI();
  })
  const deposit = participants.map(p=>(p==dataRTC.myId? parseUnits(myDeposit, unit):ethers.constants.NegativeOne));
  console.log(`Initiate channel. Participants: ${participants}\n Deposit: ${deposit}`);
  const channelId = channel.channelId;
  channelsMeta.set(channelId, {participants, deposit, nonce, status: 'funding'});
  channels.set(channel.channelId, channel);
  
  participants.forEach(p=>{
    const peer = ethPeersById.get(p);
    if(peer?.wiring){
      dispatcher.send(peer.wiring, 'channel-invite', {participants: participants, nonce: nonce || Date.now(), channelId: channelId});
    }else{
      console.error("No such peer: ", p);
    }
  })
}

function updatePeersUI(){
  const ul = document.getElementById("PeerList");
  if(!ul){
    console.log("Element not found");
    return;
  }
  ul.innerHTML = "";
  ethPeersById.forEach((value: EthPeer)=>{
    ul.innerHTML += "<li>Peer: " + value.wiring.id + ". Wallet: " + value.walletAddress + "</li>"
  });
}

function updateWalletUI(){
  const addressElem = document.getElementById("WalletAddress");
  if(addressElem){
    addressElem.innerHTML = "Address: " + myEthAccount.account;
  }
  const balanceElem = document.getElementById("WalletBalance");
  if(balanceElem){
    balanceElem.innerHTML = "Balance: " + myEthAccount.balance;
  }
}

function promptTransfer(channelId: string){
  const channelMeta = channelsMeta.get(channelId);
  const channel = channels.get(channelId);
  if(!channelMeta || !channel){ return }
  const specs: PromptInputSpec[] = [
    {text: "Payer", type: "select", value: channelMeta.participants},
    {text: "Payee", type: "select", value: channelMeta.participants},
    {text: "Amount", type: "number", value: 0},
    {text: "Unit", type: "select", value: ["wei", "gwei"]}];
  promptUser("Make transfer", specs, (response, inputs)=>{
    if(response){
      const payer = channel.getParticipantIndex(getWalletAddress(inputs[0]));
      const payee = channel.getParticipantIndex(getWalletAddress(inputs[1]));
      const amount = inputs[2];
      const unit = inputs[3];
      channel.transfer([{payer , payee, amount, unit}]).then((signed)=>{
        const action:Action = {action: 'transaction', transactions: [{payer: inputs[0], payee: inputs[1], amount, unit}]};
        boardcastState(signed, channelId, action, channelMeta.participants);
        channelMeta.status = "awaiting-consense";
        updateChannelUI();
      });
    }
  })
}

function promptFinalize(channelId: string){
  const channelMeta = channelsMeta.get(channelId);
  const channel = channels.get(channelId);
  if(!channelMeta || !channel){ return }
  channel.on('closed', (channel, outcome)=>{
    channelMeta.status = 'closed';
    updateChannelUI();
    channelMeta.participants.forEach(p=>{
      const peer = ethPeersById.get(p);
      if(peer){
        dispatcher.send(peer.wiring, 'channel-closed', channel.channelId);
      }
    })
  })
  promptUser("Finalize?", [], (response)=>{
    if(response){
      channel.finalize().then((result)=>{
        boardcastState(result.state, channelId, {action: 'finalize'}, channelMeta.participants);
        channelMeta.status = 'awaiting-consense';
        updateChannelUI();
      })
    }
  })
}

function updateChannelUI(){
  const ul = document.getElementById("ChannelList");
  if(!ul){
    console.error("UI ChannelList not found");
    return;
  }

  ul.innerHTML ="";
  channelsMeta.forEach((v, k)=>{
    const channel = channels.get(k);
    if(!channel) { return }
    const item = document.createElement("li");
    const channelName = document.createElement("h3");
    channelName.innerText = k;
    item.appendChild(channelName);
    const status = document.createElement("h3");
    status.innerText = `Status: ${v.status}`;
    item.appendChild(status);
    const allocation  = channel.statesConsensed? channel.getAllocationsFrom(channel.statesConsensed[0].state) : undefined;
    item.appendChild(document.createTextNode("Participants:"));
    const participantsTable = v.participants.reduce((table, p, i)=>{
      const row = document.createElement("tr");
      const name = document.createElement("td");
      name.innerText = p;
      const alloc = document.createElement("td");
      alloc.innerText = allocation? allocation[i].toString() : '-';
      row.appendChild(name);
      row.appendChild(alloc);
      table.appendChild(row);
      return table;
    }, document.createElement("table"));
    item.appendChild(participantsTable);
    const action = document.createElement("div");
    const btnTransfer = document.createElement("button");
    btnTransfer.textContent = "Transfer";
    btnTransfer.onclick = ()=>{
      promptTransfer(k);
    }
    btnTransfer.disabled = v.status!='consensed';
    const btnFinalize = document.createElement("button");
    btnFinalize.textContent = "Finalize";
    btnFinalize.onclick = ()=>{
      promptFinalize(k);
    }
    btnFinalize.disabled = v.status != 'consensed';
    action.appendChild(btnTransfer);
    action.appendChild(btnFinalize);
    item.appendChild(action);

    ul.appendChild(item);
  })
}

portis.onLogin(async (walletAddress: string)=>{
  const provider = new ethers.providers.Web3Provider(portis.provider);
  const signer = new PortisEthSigner(provider.getSigner());
  myEthAccount.account = await signer.fetchAddress();
  myEthAccount.signer = signer as unknown as Wallet;

  console.log(myEthAccount.account);
  myEthAccount.balance = await web3.eth.getBalance(myEthAccount.account);
  console.log(myEthAccount.balance);
  updateWalletUI();

  dataRTC.register(signalingUrl, ()=>{
    dispatcher.myId = dataRTC.myId;
    dataRTC.listPeers();
  });

  FullConsensusChannel.NitroAdjudicator =  new ethers.Contract(
    "0x0cD8B112B94c16FDC7E68E8ced030F0FCA6bb84d",
    ContractArtifacts.NitroAdjudicatorArtifact.abi,
    provider.getSigner(0)
  );

  FullConsensusChannel.EthAssetHolder = new ethers.Contract(
    "0x0c21F09C4fA08D521091F8d22F79f15E52DDd610",
    ContractArtifacts.EthAssetHolderArtifact.abi,
    provider.getSigner(0)
  );

  const btn = document.getElementById("BtnNewChannel");
  if(btn){
    btn.onclick = (ev:MouseEvent)=>{
      const inputs: PromptInputSpec[] = Array.from(ethPeersById.entries()).map(kv=>{return {type:'checkbox', text:kv[0], value:false}});
      inputs.push({type:'number', text:'Depose', value:0}, {type:'select', text:'Unit', value:["wei", "gwei"]});
      console.log(inputs);
      promptUser("Create channel. Select users to join and input deposit amount", inputs, (response, answers)=>{
        if(response){
          console.log(answers);
          const particiants = answers.slice(0, answers.length-2).map((ans, i)=>ans?inputs[i].text:"").filter(p=>p!="");
          if(dataRTC.myId){
            particiants.push(dataRTC.myId)
          }
          const myDeposit = answers[answers.length-2];
          const unit = answers[answers.length-1];

          console.log(particiants, myDeposit, unit);
          initiateChannel(particiants, myDeposit, unit);
        }
      });
    }
  }
});
(async ()=>{
await portis.showPortis();
})();