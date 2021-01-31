import { BrowserRouter as Router } from "react-router-dom";
import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import store from "./redux/store";

import App from "./App"; 
import statechannelsActions from "./redux/actions/statechanenls";
import * as clientActions from "./redux/actions/client";

const debug = require('debug');
debug.enable();
debug.log = console.info.bind(console);

import client from '../lib/client';
const { wallet, webtorrent, payment, leecher } = global.client = client;

//for debug
global.store = store;
store.subscribe(async()=> {
  //const state = store.getState();
});

wallet.on('login', async(address) => {
  console.log('run leecher for', {address});
  store.dispatch(clientActions.login(address));

  const balance = await wallet.getSigner().getBalance();
  store.dispatch(clientActions.setBalance(balance));
});
wallet.open();

let rendered = false;
leecher.on('add', async(torrent)=> {
  //TODO: add actions file for this?
  await new Promise(resolv=>setTimeout(resolv, 2000));
  store.dispatch({type: 'TORRENT', torrent});

  torrent.on('download', (bytes)=> {
    store.dispatch({type: 'TORRENT', torrent})
    if (!rendered) {
      const file = (torrent.files && torrent.files[0]);
      if (file) {
        console.log('render video');
        rendered = true;
        file.renderTo('video#MainVideoPlayer');
      }
    }
  });
});


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

  const statechannel = payment.getChannel(address);
  const holdings = parseInt(statechannel.holdings.toString());
  store.dispatch(statechannelsActions.updateDeposited(channelId, holdings));

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
});


//--------------------------------------------------

ReactDOM.render(
  <Router>
    <Provider store={store}>
      <App/>
    </Provider>
  </Router>,
  document.getElementById("root")
);

