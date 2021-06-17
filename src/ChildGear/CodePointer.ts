import { IModLoaderAPI } from "modloader64_api/IModLoaderAPI";

export class CodePointer {

    normal: number;
    lod: number;
    ModLoader: IModLoaderAPI;
    original: number = -1;

    constructor(ModLoader: IModLoaderAPI, normal: number, lod: number) {
        this.normal = normal;
        this.lod = lod;
        this.ModLoader = ModLoader;
    }

    setPointers(data: number) {
        if (this.original < 0) {
            this.original = this.ModLoader.emulator.rdramRead32(this.normal);
        }
        this.ModLoader.emulator.rdramWrite32(this.normal, data);
        this.ModLoader.emulator.rdramWrite32(this.lod, data);
    }

    restorePointers() {
        if (this.original < 0) return;
        this.ModLoader.emulator.rdramWrite32(this.normal, this.original);
        this.ModLoader.emulator.rdramWrite32(this.lod, this.original);
    }

    getPointers(){
        return this.ModLoader.emulator.rdramRead32(this.normal);
    }

}