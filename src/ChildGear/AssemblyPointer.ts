import { IModLoaderAPI } from "modloader64_api/IModLoaderAPI";

export class AssemblyPointer{

    hi32: number;
    lo32: number;

    constructor(hi: number, lo: number){
        this.hi32 = hi;
        this.lo32 = lo;
    }

    write(ModLoader: IModLoaderAPI, value: number){
        let buf: Buffer = Buffer.alloc(0x4);
        buf.writeUInt32BE(value);
        ModLoader.emulator.rdramWrite16(this.hi32, buf.readUInt16BE(0));
        ModLoader.emulator.rdramWrite16(this.lo32, buf.readUInt16BE(2));
    }

}