import {Peer, DataRTC} from "./rtcdc"

const RTC:DataRTC = new DataRTC();
RTC.onPeerListUpdated = (peers: Peer[])=>{
  peers.forEach(peer => {
    RTC.connect(peer);  //No new connection if already connected
  });
}
RTC.onPeerConnected = (peer: Peer) => {
  if(peer.channel){
    peer.channel.send("Hi, " + peer.id + ". This is " + RTC.myId);
    peer.channel.onmessage = console.log;
  }
}
(async ()=>{
  RTC.register("ws://192.168.1.134:8086/", ()=>RTC.listPeers());
})();