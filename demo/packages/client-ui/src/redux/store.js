import { createStore, combineReducers } from "redux";
import StateChannelsReducer from "./reducers/statechannels";
import ClientReducer from "./reducers/client";
import TorrentReducer from "./reducers/torrent";

const rootReducer = combineReducers({
  statechannels: StateChannelsReducer,
  torrent: TorrentReducer,
  client: ClientReducer,
});

const initState = {
  client: { 
    logined: false, 
    uri: 'magnet:?xt=urn:btih:1a56bf8935068ab8b6a7c0d6a9c53ff0ef1e3c41&dn=sample.mp4&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com',
    address: '0x',
    balance: '0 wei'
  },
  statechannels: {},
  torrent: {},
//  peers: []
}

const store = createStore(rootReducer, initState);
export default store;


/*
state: {
  client: {
    logined: false,
    address: '0x12839123123',
    balance?
    uri
  },
  statechannels: {
    "abc123": {
      channelStatus: "active",
      amountDeposited: 100000,
      allocationItems: [{destination:'0x0101010989ae214', amount: "50000"}, {destination:'0x781278541a7c8b', amount: "50000"}],
    },
  },
  torrent: {
    length: 12345,
  },
  video: {
    src: 'http://abc.com/sample.mp4",
  },
  peers: [
    {peerId, address, downloadSpeed, uploadSpeed, downloaded, uploaded}
  ]
}
*/

