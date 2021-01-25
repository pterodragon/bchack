import {Server, Socket} from "socket.io"
import {SdpCall} from "../lib/messages"

declare type UUID4 = string;

function uuid4(): UUID4{
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c):string => {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
}

let gSocketsByUid: Map<UUID4, Socket> = new Map();
let gUidsBySocket: Map<string, UUID4> = new Map();

let io = new Server(8086, {
    cors:{
        origin: "*"
    }
});

io.on("connection", (socket: Socket)=>{
    console.log("Now serving: ", socket.id);

    socket.on("register", (uuid?: UUID4)=>{
        if(uuid){
            gSocketsByUid.delete(uuid);
        }else{
            uuid = uuid4();
        }
        gSocketsByUid.set(uuid, socket);
        gUidsBySocket.set(socket.id, uuid);
        socket.emit("uuid-update", uuid);
    })

    socket.on("list-peers", ()=>{
        const socketIds = Array.from(gUidsBySocket.keys()).filter(v=>v!=socket.id);
        const uids = socketIds.map(sid=>gUidsBySocket.get(sid));
        console.log("Listing peers: ", uids)
        socket.emit("peer-updates", uids);
    })

    const forwardCall = (direction: string, calling: SdpCall) => {
        const target = gSocketsByUid.get(calling.peer);
        const source = gUidsBySocket.get(socket.id);
        console.log("Forwarding ", direction, " from [", source, "] to [", calling.peer, "] : ", calling.sdp)
        if(target && source){
            const initiator: SdpCall = {peer: source, sdp: calling.sdp};
            target.emit(direction, initiator);
        }
    }

    socket.on("call-peer", (calling?: SdpCall)=>{
        if(!calling){
            return
        }
        forwardCall("incoming-call", calling);
    })

    socket.on("answer-call", (calling?: SdpCall)=>{
        if(!calling){
            return
        }
        forwardCall("incoming-answer", calling);
    })

    socket.on("forward-ice-candidate", (calling?: SdpCall)=>{
        if(!calling){
            return
        }
        forwardCall("incoming-ice-candidate", calling);
    })

    socket.on("disconnect", ()=>{
        const id = gUidsBySocket.get(socket.id);
        if(id){
            gSocketsByUid.delete(id);
            gUidsBySocket.delete(socket.id);
        }
    })
});