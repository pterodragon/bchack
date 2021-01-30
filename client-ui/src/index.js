import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router } from "react-router-dom";
import App from "./App";
import {Leecher} from '../lib/leecher';
import WebTorrent, {Torrent} from 'webtorrent-hybrid';

import {PortisWallet} from "../lib/portis";
import {MetamaskWallet} from "payment-statechannel";
const debug = require('debug');
debug.enable();
debug.log = console.info.bind(console);


//const wallet = new MetamaskWallet();
const wallet = new PortisWallet(process.env.DAPP_ADDRESS, process.env.DAPP_NETWORK);
global.wallet = wallet;

(typeof global === 'undefined' ? window : global).WEBTORRENT_ANNOUNCE = null;

const client = new WebTorrent({peerId: '2d5757303031322d724a32683939617936376c5b'});
global.client = client;

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
