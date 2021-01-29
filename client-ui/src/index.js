import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router } from "react-router-dom";
import store from "./redux/store";
import { Provider } from "react-redux";
import WebTorrent, {Torrent} from 'webtorrent-hybrid';
import App from "./App";

//for debug
global.store = store;


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


ReactDOM.render(
  <Router>
    <Provider store={store}>
      <App/>
    </Provider>
  </Router>,
  document.getElementById("root")
);

