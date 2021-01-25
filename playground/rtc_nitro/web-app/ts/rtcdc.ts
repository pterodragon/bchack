import adapter from "webrtc-adapter"

import {SdpCall} from "../../lib/messages";
import { io, Socket } from "socket.io-client";

export declare interface Peer{
  id: string
  connection?: RTCPeerConnection;
  channel?: RTCDataChannel;
}

const rtcConfig:RTCConfiguration = {
  iceServers: [
    {
      urls: ["stun:stun.l.google.com:19302", "stun:stun.stunprotocol.org:3478"]
    }
  ]
};

export class DataRTC {

  public myId?: string;
  private signaling?: Socket;
  private peersByUid: Map<string, Peer>

  private forwardIceCandidate = (peerId: string)=>{
    return (ev:RTCPeerConnectionIceEvent) => {
      if(!ev){
        return
      }
      console.log("Got ICE Candidate: ", ev.candidate)
      this.signaling?.emit("forward-ice-candidate", {peer: peerId, sdp: ev.candidate})
    }
  }

  public onPeerListUpdated?: (peers: Peer[]) => void;
  public onPeerConnected?: (peer: Peer) => void;

  constructor(){
    this.peersByUid = new Map();
  }

  public register(signalServer: string, callback: ()=>void) {
    this.signaling = io(signalServer);
    this.peersByUid = new Map();

    this.signaling.on("connect", ()=>{
      this.signaling?.emit("register", this.myId);
    })

    this.signaling.on("uuid-update", (uuid?: string)=>{
      if(uuid){
        this.myId = uuid;
      }
      console.log("Got UUID from signaling server: ", this.myId);
      callback();
    });

    this.signaling.on("peer-updates", (peers?: string[])=>{
      if(!peers){
        return;
      }

      console.log("Server returned: ", peers);
      peers.forEach(peerId => {
        if(!this.peersByUid.has(peerId)){
          this.peersByUid.set(peerId, {id: peerId});
        }
      });
      if(this.onPeerListUpdated){
        this.onPeerListUpdated(Array.from(this.peersByUid.values()))
      }else{
        console.error("No handler registered for onPeerListUpdated");
      }
    });

    this.signaling.on("incoming-call", (calling?: SdpCall)=>{
      if(!calling){
        return
      }

      let connection: RTCPeerConnection = new RTCPeerConnection(rtcConfig);
      let incomingPeer: Peer = {id: calling.peer, connection: connection, channel: undefined}
      connection.ondatachannel = (ev)=>{
        incomingPeer.channel = ev.channel;
        incomingPeer.channel.onopen = ()=> {
          if(this.onPeerConnected){
            this.onPeerConnected(incomingPeer);
          }else{
            console.error("No handler registered for onPeerConnected")
          }
        }
      }
      connection.onicecandidate = this.forwardIceCandidate(incomingPeer.id)

      console.log("Incoming call [", calling.peer , "]: ", calling.sdp)
      connection.setRemoteDescription(new RTCSessionDescription(calling.sdp))
      .then(()=>connection.createAnswer())
      .then((answer: RTCSessionDescriptionInit)=>connection.setLocalDescription(answer))
      .then(()=>this.signaling?.emit("answer-call", {peer: calling.peer, sdp: connection.localDescription}))
      .catch(err=>console.error)

    })

    this.signaling.on("incoming-answer", (calling?: SdpCall)=>{
      if(!calling){
        return
      }

      let peer = this.peersByUid.get(calling.peer);
      if(peer && peer.connection){
        console.log("Incoming answer [", calling.peer , "]: ", calling.sdp)
        peer.connection.setRemoteDescription(calling.sdp)
        .catch(err=>console.error)
      }
    })

    this.signaling.on("incoming-ice-candidate", (calling?: SdpCall)=>{
      if(!calling){
        return
      }

      const peer = this.peersByUid.get(calling.peer);
      if(peer){
        if(calling.sdp && peer.connection){
          peer.connection.addIceCandidate(calling.sdp)
        }
      }
    })
  }

  public listPeers(): void{
    this.signaling?.emit("list-peers");
  }

  public connect(peer:Peer): void{
    const p = this.peersByUid.get(peer.id)
    if(!p){
      console.error("Unknown peer: ", peer.id);
      return;
    }

    if(peer.connection?.connectionState === "connected"){
      return;
    }

    let connection: RTCPeerConnection = new RTCPeerConnection(rtcConfig);
    let datachannel: RTCDataChannel = connection.createDataChannel("rtcdc");
    
    p.connection = connection;
    p.channel = datachannel;
    
    datachannel.onopen = ()=>{
      if(this.onPeerConnected){
        this.onPeerConnected(peer);
      }else{
        console.error("No handler registered for onPeerConnected");
      }
    }

    connection.onicecandidate = this.forwardIceCandidate(p.id)

    connection.createOffer()
    .then((offer: RTCSessionDescriptionInit)=>connection.setLocalDescription(offer))
    .then(()=>this.signaling?.emit("call-peer", {peer: p.id, sdp: connection.localDescription}))
    .catch(err=>console.error)
  }
}

