import WebTorrent from 'webtorrent-hybrid';
import {Leecher} from 'webtorrentx-paid'; 
import {PortisWallet} from "../lib/portis";
import {MetamaskWallet, StateChannelsPayment} from "payment-statechannel";

function createClient() {

  const wallet = process.env.WALLET_TYPE === 'portis' ?
    new PortisWallet(process.env.DAPP_ADDRESS, process.env.DAPP_NETWORK) :
    new MetamaskWallet();

  //@ts-ignore
  (typeof global === 'undefined' ? window : global).WEBTORRENT_ANNOUNCE = null;
  const webtorrent = new WebTorrent({peerId: process.env.CLIENT_PEER_ID});

  const payment = new StateChannelsPayment(wallet);

  const leecher = new Leecher(webtorrent, payment);
  
  return { wallet, webtorrent, payment, leecher };
}

const client = createClient();

export default client;
