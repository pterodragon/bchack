import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router } from "react-router-dom";
import App from "./App";

//import {PortisWallet} from "../lib/portis";
import {MetamaskWallet} from "payment-statechannel";
import {Leecher} from "webtorrentx-paid";


//const wallet = new PortisWallet(process.env.DAPP_ADDRESS, process.env.DAPP_NETWORK);
const wallet = new MetamaskWallet();
global.wallet = wallet;

const leecher = new Leecher(wallet, {
  dhtPort: '40001',
  dht: {
    timeBucketOutdated: 60000, maxAge: 60000,
    bootstrap: 'seeder:40000',
  }
});
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
