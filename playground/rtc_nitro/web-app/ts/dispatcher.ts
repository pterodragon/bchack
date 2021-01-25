import {EventEmitter} from "events"
import {Peer} from "./rtcdc"

export class Dispatcher {
    private emitter: EventEmitter;
    public myId?: string;

    constructor(){
        this.emitter = new EventEmitter();
    }

    public getMessageListener(): (ev:MessageEvent<any>)=>any{
        return (ev: MessageEvent<any>)=>{
            const message = JSON.parse(ev.data);
            console.log("Recevied message from peer: ", message);
            this.emitter.emit(message.tag, message.senderId, message.payload)
        }
    }

    public send(peer:Peer, event: string, value: any){
        peer.channel?.send(JSON.stringify({tag: event, senderId: this.myId, payload: value}))
    }

    public on(event:string, listener: (senderId: string, payload: any)=>void ): this{
        this.emitter.on(event, listener);
        return this;
    }
}