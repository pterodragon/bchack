import {EventEmitter} from "events"
import {Wire, Extension} from "bittorrent-protocol"

/**
 * A simple messaging facility to allow communication btw peer.
 * An instance is created for each connection as designed by BT spec.
 * 
 * Assuming we can access this from the wire object.
 */
export interface ut_sidetalk{
    on(tag:string, handler:(wire:Wire, message: object)=>void): this;
    send(tag:string, value: object): void;
}

export class ut_sidetalk extends EventEmitter implements Extension{
    public name:string = "ut_sidetalk"

    
    private wire:Wire;

    constructor(wire:Wire){
        super()

        this.wire = wire
        this.wire.extendedMapping
    }

    public onMessage(buf: Buffer): void{
        const msg = JSON.parse(buf.toString());
        if(msg.tag){
            this.emit(msg.tag, this.wire, msg.payload)
        }
    }

    public send(tag:string, value: object): void{
        const buf = Buffer.from(JSON.stringify(value));
        this.wire.extended(this.name, buf);
    }
}