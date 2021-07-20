import { IPlugin, IModLoaderAPI, ModLoaderEvents } from 'modloader64_api/IModLoaderAPI';
import { Age, IOOTCore, OotEvents, Sword } from 'modloader64_api/OOT/OOTAPI';
import { InjectCore } from 'modloader64_api/CoreInjection';
import { bus, EventHandler, EventsClient } from 'modloader64_api/EventHandler';
import { onViUpdate } from 'modloader64_api/PluginLifecycle';
import fse from 'fs-extra';
import path from 'path';
import { Z64RomTools } from 'Z64Lib/API/Z64RomTools';
import { Z64LibSupportedGames } from 'Z64Lib/API/Z64LibSupportedGames';
import { IModelReference, registerModel, Z64OnlineEvents, Z64Online_LocalModelChangeProcessEvt, Z64Online_ModelAllocation } from './OotOAPI';
import { CodePointer } from './CodePointer';
import { OpaStack } from './OpaStack';
import { DisplayListBuilder } from './DisplayListBuilder';
import { AssemblyPointer } from './AssemblyPointer';

interface ChildGearConfig {
    unlockItemsAsChild: boolean;
    allowAdultToUseCrawlspace: boolean;
    allowChildToUseGauntletBlocks: boolean;
}

class ChildGear implements IPlugin {

    ModLoader!: IModLoaderAPI;
    pluginName?: string | undefined;
    @InjectCore()
    core!: IOOTCore;
    config!: ChildGearConfig;
    childPointers: Map<string, CodePointer> = new Map<string, CodePointer>();
    adultPointers: Map<string, CodePointer> = new Map<string, CodePointer>();
    opa!: OpaStack;
    wasPaused: boolean = false;
    lastEvt!: Z64Online_LocalModelChangeProcessEvt;
    arm!: IModelReference;
    // Credit for research: Aegiker
    blockPushCodeBackup!: Buffer;
    blockPushCodeReplacement: Buffer = Buffer.from('24080000', 'hex');
    blockPushCodeAddr: number = 0x80079B0C;

    preinit(): void {
        this.config = this.ModLoader.config.registerConfigCategory("ChildGear") as ChildGearConfig;
        this.ModLoader.config.setData("ChildGear", "unlockItemsAsChild", true);
        this.ModLoader.config.setData("ChildGear", "allowAdultToUseCrawlspace", false);
        this.ModLoader.config.setData("ChildGear", "allowChildToUseGauntletBlocks", false);
    }

    init(): void {
        let o = fse.readJSONSync(path.resolve(__dirname, "ChildPointers.json"));
        Object.keys(o).forEach((key: string) => {
            this.childPointers.set(key, new CodePointer(this.ModLoader, parseInt(o[key].normal, 16), parseInt(o[key].lod, 16)));
        });
        let o2 = fse.readJSONSync(path.resolve(__dirname, "AdultPointers.json"));
        Object.keys(o2).forEach((key: string) => {
            this.adultPointers.set(key, new CodePointer(this.ModLoader, parseInt(o2[key].normal, 16), parseInt(o2[key].lod, 16)));
        });
    }

    postinit(): void {
    }

    @EventHandler(EventsClient.ON_HEAP_READY)
    onHeap() {
        this.opa = new OpaStack(this.ModLoader, this.ModLoader.heap!.malloc(0xFF));
        this.blockPushCodeBackup = this.ModLoader.emulator.rdramReadBuffer(this.blockPushCodeAddr, this.blockPushCodeReplacement.byteLength);
    }

    @EventHandler(Z64OnlineEvents.ON_MODEL_MANAGER_READY)
    onReady() {
        let buf = fse.readFileSync(path.resolve(__dirname, "mm_fps_arm.zobj"));
        let ref = registerModel(buf, true);
        ref.loadModel();
        this.arm = ref;
    }

    @EventHandler(Z64OnlineEvents.LOCAL_MODEL_CHANGE_FINISHED)
    onFinished(evt: Z64Online_LocalModelChangeProcessEvt) {
        this.lastEvt = evt;
        this.childPointers.forEach((value: CodePointer) => {
            value.restorePointers();
        });
        this.adultPointers.forEach((value: CodePointer) => {
            value.restorePointers();
        });
        this.opa.clear();
        let child_left_hand_offset: number = 0x158;
        let adult_left_hand_offset: number = 0x110;
        let alias_offset: number = 0x5000;
        let segment_06: number = 0x06000000;
        let age = this.core.save.age;
        if (age === Age.CHILD) {

            new AssemblyPointer(0x8007AE8A, 0x8007AE8E).write(this.ModLoader, 0x040039F8);
            new AssemblyPointer(0x8007B706, 0x8007B70A).write(this.ModLoader, 0x04003FC8);

            // Megaton Hammer.
            let builder: DisplayListBuilder = new DisplayListBuilder();
            builder.addDE(evt.adult.pointer + alias_offset + 0x170);
            builder.addDE01(segment_06 + alias_offset + child_left_hand_offset);
            this.childPointers.get("megaton_hammer_hand")!.setPointers(this.opa.writeDisplayList(builder.toBuffer()));

            // Mirror Shield Back
            builder.addDE01(evt.adult.pointer + alias_offset + 0x288);
            this.childPointers.get("mirror_shield_back")!.setPointers(this.opa.writeDisplayList(builder.toBuffer()));

            // Mirror Shield Hands
            builder.addDE(evt.adult.pointer + alias_offset + 0x168);
            builder.addDE01(segment_06 + alias_offset + child_left_hand_offset);
            this.childPointers.get("mirror_shield_hand")!.setPointers(this.opa.writeDisplayList(builder.toBuffer()));

            // Sword Hand
            if (this.core.save.bButton === 0x3B) {
                builder.addDE(segment_06 + alias_offset + 0x180);
                builder.addDE(segment_06 + alias_offset + 0x188);
            } else if (this.core.save.bButton === 0x3C) {
                builder.addDE(evt.adult.pointer + alias_offset + 0x138);
                builder.addDE(evt.adult.pointer + alias_offset + 0x140);
            }
            builder.addDE01(segment_06 + alias_offset + child_left_hand_offset);
            this.childPointers.get("sword_hand")!.setPointers(this.opa.writeDisplayList(builder.toBuffer()));

            // Biggoron Sword
            builder.addDE(evt.adult.pointer + alias_offset + 0x148);
            builder.addDE(evt.adult.pointer + alias_offset + 0x150);
            builder.addDE01(segment_06 + alias_offset + child_left_hand_offset);
            this.childPointers.get("biggoron_sword_hand")!.setPointers(this.opa.writeDisplayList(builder.toBuffer()));

            // Hookshot
            builder.addDE(evt.adult.pointer + alias_offset + 0x190);
            builder.addDE01(segment_06 + alias_offset + child_left_hand_offset);
            this.childPointers.get("hookshot_third_person")!.setPointers(this.opa.writeDisplayList(builder.toBuffer()));

            let gk = this.findGameplayKeep();
            builder.addDE01(evt.adult.pointer + alias_offset + 0x218);
            this.ModLoader.emulator.rdramWriteBuffer(gk + 0x39F0, builder.toBuffer());
            builder.addDE(this.arm.pointer + 0x10);
            builder.addDE01(evt.adult.pointer + alias_offset + 0x208);
            this.ModLoader.emulator.rdramWriteBuffer(gk + 0x39F8, builder.toBuffer());
            builder.addDE01(evt.adult.pointer + alias_offset + 0x210);
            this.ModLoader.emulator.rdramWriteBuffer(gk + 0x3C90, builder.toBuffer());
            builder.addDE01(evt.adult.pointer + alias_offset + 0x220);
            this.ModLoader.emulator.rdramWriteBuffer(gk + 0x3FC8, builder.toBuffer());
            
            if (this.config.allowChildToUseGauntletBlocks){
                this.ModLoader.emulator.rdramWriteBuffer(this.blockPushCodeAddr, this.blockPushCodeReplacement);
            }
        }else if (age === Age.ADULT){

            new AssemblyPointer(0x8007AE8A, 0x8007AE8E).write(this.ModLoader, segment_06 + alias_offset + 0x370);
            new AssemblyPointer(0x8007B706, 0x8007B70A).write(this.ModLoader, segment_06 + alias_offset + 0x220);

            let builder: DisplayListBuilder = new DisplayListBuilder();

            // Deku Shield hand
            builder.addDE(evt.child.pointer + alias_offset + 0xD0);
            builder.addDE01(segment_06 + alias_offset + adult_left_hand_offset);
            this.adultPointers.get("deku_shield_hand")!.setPointers(this.opa.writeDisplayList(builder.toBuffer()));

            // Deku Shield back
            builder.addDE(segment_06 + alias_offset + 0x130);
            builder.pushMatrix(segment_06 + alias_offset + 0x10);
            builder.addDE(segment_06 + alias_offset + 0x138);
            builder.popMatrix();
            builder.addDE01(evt.child.pointer + alias_offset + 0x278);
            this.adultPointers.get("deku_shield_back")!.setPointers(this.opa.writeDisplayList(builder.toBuffer()));

            // Boomerang hand
            builder.addDE(evt.child.pointer + alias_offset + 0x1B0);
            builder.addDE01(segment_06 + alias_offset + adult_left_hand_offset);
            this.adultPointers.get("boomerang_hand")!.setPointers(this.opa.writeDisplayList(builder.toBuffer()));

            let gk = this.findGameplayKeep();
            builder.addDE01(evt.adult.pointer + alias_offset + 0x218);
            this.ModLoader.emulator.rdramWriteBuffer(gk + 0x39F0, builder.toBuffer());
            builder.addDE(evt.adult.pointer + alias_offset + 0x200);
            builder.addDE01(evt.adult.pointer + alias_offset + 0x208);
            this.ModLoader.emulator.rdramWriteBuffer(gk + 0x39F8, builder.toBuffer());
            builder.addDE01(evt.adult.pointer + alias_offset + 0x210);
            this.ModLoader.emulator.rdramWriteBuffer(gk + 0x3C90, builder.toBuffer());
            builder.addDE01(evt.adult.pointer + alias_offset + 0x220);
            this.ModLoader.emulator.rdramWriteBuffer(gk + 0x3FC8, builder.toBuffer());

            if (this.config.allowChildToUseGauntletBlocks){
                this.ModLoader.emulator.rdramWriteBuffer(this.blockPushCodeAddr, this.blockPushCodeBackup);
            }
        }
    }

    findGameplayKeep() {
        let obj_list: number = 0x801D9C44;
        let obj_id = 0x00010000;
        for (let i = 4; i < 0x514; i += 4) {
            let value = this.ModLoader.emulator.rdramRead32(obj_list + i);
            if (value === obj_id) {
                return this.ModLoader.emulator.rdramRead32(obj_list + i + 4);
            }
        }
        return -1;
    }


    onTick(frame?: number | undefined): void {
        if (this.core.helper.isPaused()) {
            if (!this.wasPaused) {
                this.wasPaused = true;
            }
        } else if (this.wasPaused) {
            this.ModLoader.utils.setTimeoutFrames(() => { this.onFinished(this.lastEvt) }, 20);
            this.wasPaused = false;
        }
    }

    @EventHandler(ModLoaderEvents.ON_ROM_PATCHED_POST)
    onRomPatched(evt: any) {
        let rom: Buffer = evt.rom;
        let tools: Z64RomTools = new Z64RomTools(this.ModLoader, Z64LibSupportedGames.OCARINA_OF_TIME);
        if (this.config.unlockItemsAsChild) {
            this.ModLoader.logger.info("Unlocking all items as child. Beware.")
            let p = tools.decompressDMAFileFromRom(rom, 33);
            for (let i = 0; i < 0x7F; i++) {
                p.writeUInt8(0x9, 0x0165B4 + i);
            }
            tools.recompressDMAFileIntoRom(rom, 33, p);
        }
        let hook = tools.decompressDMAFileFromRom(evt.rom, 120);

        hook.writeUInt16BE(0x0400, 0xA72);
        hook.writeUInt16BE(0x39F0, 0xA76);

        hook.writeUInt16BE(0x0400, 0xB66);
        hook.writeUInt16BE(0x3C90, 0xB6A);

        hook.writeUInt16BE(0x0001, 0xBA8);

        tools.recompressDMAFileIntoRom(rom, 120, hook);

        /*
        let stick = tools.decompressDMAFileFromRom(evt.rom, 401);
        stick.writeUInt32BE(0x80854E20 + 0x98, 0x334);
        stick.writeUInt16BE(0x0001, 0x330);
        tools.recompressDMAFileIntoRom(evt.rom, 401, stick);
        */
    }

    @onViUpdate()
    onVi() {
        if (this.ModLoader.ImGui.beginMainMenuBar()) {
            if (this.ModLoader.ImGui.beginMenu("Mods")) {
                if (this.ModLoader.ImGui.beginMenu("ChildGear")) {
                    if (this.ModLoader.ImGui.menuItem("All items usable as child (caution)", undefined, this.config.unlockItemsAsChild, true)) {
                        this.config.unlockItemsAsChild = !this.config.unlockItemsAsChild;
                        this.ModLoader.config.save();
                    }
                    if (this.ModLoader.ImGui.menuItem("Allow Child to push gauntlet blocks", undefined, this.config.allowChildToUseGauntletBlocks)){
                        this.config.allowChildToUseGauntletBlocks = !this.config.allowChildToUseGauntletBlocks;
                        this.ModLoader.config.save();
                    }
                    if (this.ModLoader.ImGui.menuItem("Allow Adult to use crawlspaces", undefined, this.config.allowAdultToUseCrawlspace, true)) {
                        this.config.allowAdultToUseCrawlspace = !this.config.allowAdultToUseCrawlspace;
                        this.ModLoader.config.save();
                    }
                    this.ModLoader.ImGui.text("These settings require a game restart to take effect.");
                    this.ModLoader.ImGui.endMenu();
                }
                this.ModLoader.ImGui.endMenu();
            }
            this.ModLoader.ImGui.endMainMenuBar();
        }
    }

    doesLinkObjExist(age: Age) {
        let link_object_pointer: number = 0;
        let obj_list: number = 0x801D9C44;
        let obj_id = age === Age.ADULT ? 0x00140000 : 0x00150000;
        for (let i = 4; i < 0x514; i += 4) {
            let value = this.ModLoader.emulator.rdramRead32(obj_list + i);
            if (value === obj_id) {
                link_object_pointer = obj_list + i + 4;
                break;
            }
        }
        if (link_object_pointer === 0) return { exists: false, pointer: 0 };
        link_object_pointer = this.ModLoader.emulator.rdramRead32(link_object_pointer);
        return { exists: this.ModLoader.emulator.rdramReadBuffer(link_object_pointer + 0x5000, 0xB).toString() === "MODLOADER64", pointer: link_object_pointer };
    }

}

module.exports = ChildGear;