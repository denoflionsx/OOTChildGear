import { SmartBuffer } from 'smart-buffer';

export class DisplayListBuilder{

    private buf: SmartBuffer = new SmartBuffer();

    constructor(){}

    addDE01(pointer: number){
        this.buf.writeUInt32BE(0xDE010000);
        this.buf.writeUInt32BE(pointer);
    }

    addDE(pointer: number){
        this.buf.writeUInt32BE(0xDE000000);
        this.buf.writeUInt32BE(pointer);
    }

    addDA(pointer: number){
        this.buf.writeUInt32BE(0xDA380000);
        this.buf.writeUInt32BE(pointer);
    }

    addDF(){
        this.buf.writeUInt32BE(0xDF000000);
        this.buf.writeUInt32BE(0x00000000);
    }

    pushMatrix(pointer: number){
        this.buf.writeUInt32BE(0xDA380000);
        this.buf.writeUInt32BE(pointer);
    }

    popMatrix(){
        this.buf.writeUInt32BE(0xD8380002);
        this.buf.writeUInt32BE(0x00000040);
    }

    toBuffer(){
        let b = this.buf.toBuffer();
        this.reset();
        return b;
    }

    reset(){
        this.buf.clear();
    }

}