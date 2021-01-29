import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router } from "react-router-dom";
import App from "./App";
import {Leecher} from '../lib/leecher';
import WebTorrent, {Torrent} from 'webtorrent-hybrid';

//import {PortisWallet} from "../lib/portis";
import {MetamaskWallet} from "payment-statechannel";
const debug = require('debug');
debug.enable();
debug.log = console.info.bind(console);


//const wallet = new PortisWallet(process.env.DAPP_ADDRESS, process.env.DAPP_NETWORK);
const wallet = new MetamaskWallet();
global.wallet = wallet;

(typeof global === 'undefined' ? window : global).WEBTORRENT_ANNOUNCE = null;

const client = new WebTorrent({peerId: '2d5757303031322d724a32683939617936376c5b'});
global.client = client;
/*
global.logTorrent = (torrent)=> {
  torrent.on('ready', (...args)=>console.log('ready', args));
  torrent.on('wire', (...args)=>console.log('wire', args));
  torrent.on('download', (...args)=>console.log('download', args));
  torrent.on('upload', (...args)=>console.log('upload', args));
  torrent.on('metadata', (...args)=>console.log('metadata', args));
  torrent.on('infoHash', (...args)=>console.log('infoHash', args));
  torrent.on('warning', (...args)=>console.log('warning', args));
  torrent.on('error', (...args)=>console.log('error', args));
};
*/

const leecher = new Leecher(client, wallet);
global.leecher = leecher;

wallet.open();
wallet.on('login', async(address) => {
  console.log('run leecher for', {address});
});

ReactDOM.render(
  <Router>
    <App portis={wallet._portis}/>
  </Router>,
  document.getElementById("root")
);
