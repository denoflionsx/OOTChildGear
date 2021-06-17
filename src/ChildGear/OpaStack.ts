import { IModLoaderAPI } from "modloader64_api/IModLoaderAPI";

export class OpaStack {

    ModLoader: IModLoaderAPI;
    start: number;
    head: number;

    constructor(ModLoader: IModLoaderAPI, start: number) {
        this.ModLoader = ModLoader;
        this.start = start;
        this.head = this.start;
    }

    writeDisplayList(dlist: Buffer) {
        let r = this.head;
        this.ModLoader.emulator.rdramWriteBuffer(this.head, dlist);
        this.head += dlist.byteLength;
        return r;
    }

    clear(){
        this.ModLoader.emulator.rdramWriteBuffer(this.start, Buffer.alloc(0xFF));
        this.head = this.start;
    }

}