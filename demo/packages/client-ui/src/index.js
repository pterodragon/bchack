import WebTorrent from 'webtorrent-hybrid';

import {Leecher} from 'webtorrentx-paid'; 
//import {PortisWallet} from "../lib/portis";
import {MetamaskWallet, StateChannelsPayment} from "payment-statechannel";

import { BrowserRouter as Router } from "react-router-dom";

const debug = require('debug');
debug.enable();
debug.log = console.info.bind(console);

//--------------------------------------------------
// webtorrent and payment logic

const wallet = new MetamaskWallet();
//const wallet = new PortisWallet(process.env.DAPP_ADDRESS, process.env.DAPP_NETWORK);
global.wallet = wallet;

(typeof global === 'undefined' ? window : global).WEBTORRENT_ANNOUNCE = null;
const client = new WebTorrent({peerId: '2d5757303031322d724a32683939617936376c5b'});
global.client = client;

const payment = new StateChannelsPayment(wallet);
global.payment = payment;

const leecher = new Leecher(client, payment);
global.leecher = leecher;

wallet.open();
wallet.on('login', async(address) => {
  console.log('run leecher for', {address});
});

//--------------------------------------------------
// UI event dispatch
import store from "./redux/store";
import statechannelsActions from "./redux/actions/statechanenls";

//for debug
global.store = store;

payment.on('stateUpdated', (address, channelId, {state})=> {
  const allocationItems = state.outcome.reduce((ret, cur)=> {
    for (const item of cur.allocationItems ) {
      //hex to dec
      const amount = parseInt(item.amount);
      ret.push({...item, amount});
    }
    return ret;
  },[]) || [];
  store.dispatch(statechannelsActions.updateAllocations(channelId, allocationItems));

  if (state.isFinal) {
    store.dispatch(statechannelsActions.updateStatus(channelId, 'completed'));
  }
});

payment.on('handshakeBack', (address, handshakeId, channelId)=>{
  const channel = {
    channelStatus: "active",
    amountDeposited: 0,
    allocationItems: [],
  };
  store.dispatch(statechannelsActions.addChannel(channelId, channel));

  const statechannel = payment.getChannel(address);
  const holdings = parseInt(statechannel.holdings.toString());
  store.dispatch(statechannelsActions.updateDeposited(channelId, holdings));
});


//--------------------------------------------------
import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import App from "./App"; 

ReactDOM.render(
  <Router>
    <Provider store={store}>
      <App/>
    </Provider>
  </Router>,
  document.getElementById("root")
);

