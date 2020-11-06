import { IPlugin, IModLoaderAPI, ModLoaderEvents } from 'modloader64_api/IModLoaderAPI';
import { Age, IOOTCore, OotEvents } from 'modloader64_api/OOT/OOTAPI';
import { InjectCore } from 'modloader64_api/CoreInjection';
import { EventHandler } from 'modloader64_api/EventHandler';
import { Z64RomTools } from 'Z64Lib/API/Z64RomTools';
import { Z64LibSupportedGames } from 'Z64Lib/API/Z64LibSupportedGames';
import { onViUpdate } from 'modloader64_api/PluginLifecycle';
import fse from 'fs-extra';
import { zzstatic } from 'Z64Lib/API/zzstatic';
import path from 'path';
import IMemory from 'modloader64_api/IMemory';
import { OotOModelSupport } from './OotOModelSupport';
import { ProxySide, SidedProxy } from 'modloader64_api/SidedProxy/SidedProxy';

interface ChildGearConfig {
    unlockItemsAsChild: boolean;
    allowAdultToUseCrawlspace: boolean;
}

class ChildGear implements IPlugin {

    ModLoader!: IModLoaderAPI;
    pluginName?: string | undefined;
    @InjectCore()
    core!: IOOTCore;
    kokiri: number = 0x8083CAF8;
    config!: ChildGearConfig;
    saveLoaded: boolean = false;
    adultBackup!: BackupCode;
    childBackup!: BackupCode;
    @SidedProxy(ProxySide.CLIENT, OotOModelSupport)
    OotOSupport!: OotOModelSupport;

    preinit(): void {
        this.config = this.ModLoader.config.registerConfigCategory("ChildGear") as ChildGearConfig;
        this.ModLoader.config.setData("ChildGear", "unlockItemsAsChild", true);
        this.ModLoader.config.setData("ChildGear", "allowAdultToUseCrawlspace", false);
    }

    init(): void {
    }

    postinit(): void {
        let zz = new zzstatic(Z64LibSupportedGames.OCARINA_OF_TIME);
        let buf = fse.readFileSync(path.resolve(__dirname, "mm_fps_arm.zobj"));
        let r = zz.doRepoint(buf, 0, false, 0x80855000);
        this.ModLoader.emulator.rdramWriteBuffer(0x80855000, r);
    }

    @EventHandler(OotEvents.ON_AGE_CHANGE)
    onAgeChanged(age: Age) {
        if (this.saveLoaded) {
            this.ModLoader.payloadManager.parseFile(path.resolve(__dirname, "dlists.gsc"));
            switch (age) {
                case Age.ADULT:
                    this.ModLoader.logger.debug("Setting up adult dlists.");
                    fse.writeFileSync(path.resolve(__dirname, "temp.gsc"), this.childBackup.code);
                    this.ModLoader.payloadManager.parseFile(path.resolve(__dirname, "temp.gsc"));
                    this.ModLoader.payloadManager.parseFile(path.resolve(__dirname, "adult_gear.gsc"));
                    break;
                case Age.CHILD:
                    this.ModLoader.logger.debug("Setting up child dlists.");
                    fse.writeFileSync(path.resolve(__dirname, "temp.gsc"), this.adultBackup.code);
                    this.ModLoader.payloadManager.parseFile(path.resolve(__dirname, "temp.gsc"));
                    this.ModLoader.payloadManager.parseFile(path.resolve(__dirname, "child_gear.gsc"));
                    break;
            }
            this.OotOSupport.ageChangeCallback();
            this.ModLoader.emulator.invalidateCachedCode();
        }
    }

    @EventHandler(ModLoaderEvents.ON_SOFT_RESET_PRE)
    onReset(evt: any) {
        this.saveLoaded = false;
    }

    @EventHandler(OotEvents.ON_SAVE_LOADED)
    onSaveLoaded(evt: any) {
        this.saveLoaded = true;
        this.adultBackup = GameSharkBackup.backup_gs(fse.readFileSync(path.resolve(__dirname, "adult_gear.gsc")), this.ModLoader.emulator);
        this.childBackup = GameSharkBackup.backup_gs(fse.readFileSync(path.resolve(__dirname, "child_gear.gsc")), this.ModLoader.emulator);
        this.ModLoader.payloadManager.parseFile(path.resolve(__dirname, "dlists.gsc"));
        this.onAgeChanged(this.core.save.age);
    }

    onTick(frame?: number | undefined): void {
        if (!this.core.helper.isTitleScreen() && this.core.helper.isSceneNumberValid()) {
            if (this.ModLoader.emulator.rdramRead8(0x801DAB6D) === 0x3B && this.kokiri > 0) {
                this.ModLoader.emulator.rdramWrite32(0x800F790C, this.kokiri);
                this.ModLoader.emulator.rdramWrite32(0x800F790C + 8, this.kokiri);
            } else {
                this.ModLoader.emulator.rdramWrite32(0x800F790C, 0x80837800 + 0x1D690);
                this.ModLoader.emulator.rdramWrite32(0x800F790C + 8, 0x80837800 + 0x1D690);
            }
            if (this.core.save.age === Age.ADULT && this.config.allowAdultToUseCrawlspace){
                if (this.ModLoader.emulator.rdramRead8(0x80395B03) === 0x99){
                    this.ModLoader.emulator.rdramWrite8(0x80395B03, 0x00);
                }
            }
        }
    }

    @EventHandler(ModLoaderEvents.ON_ROM_PATCHED)
    onRomPatched(evt: any) {
        if (this.config.unlockItemsAsChild) {
            this.ModLoader.logger.info("Unlocking all items as child. Beware.")
            let rom: Buffer = evt.rom;
            let tools: Z64RomTools = new Z64RomTools(this.ModLoader, Z64LibSupportedGames.OCARINA_OF_TIME);
            let p = tools.decompressDMAFileFromRom(rom, 33);
            for (let i = 0; i < 0x7F; i++) {
                p.writeUInt8(0x9, 0x0165B4 + i);
            }
            tools.recompressDMAFileIntoRom(rom, 33, p);
            let hook = tools.decompressDMAFileFromRom(evt.rom, 120);

            hook.writeUInt16BE(0x8080, 0xA72);
            hook.writeUInt16BE(0x5218, 0xA76);

            hook.writeUInt16BE(0x8080, 0xB66);
            hook.writeUInt16BE(0x5210, 0xB6A);

            hook.writeUInt16BE(0x0001, 0xBA8);

            tools.recompressDMAFileIntoRom(rom, 120, hook);

            let player = tools.decompressDMAFileFromRom(evt.rom, 34);
            player.writeUInt32BE(0x8083C9E8, 0x22548);
            tools.recompressDMAFileIntoRom(evt.rom, 34, player);

            let stick = tools.decompressDMAFileFromRom(evt.rom, 401);
            stick.writeUInt32BE(0x80854FA0, 0x334);
            stick.writeUInt16BE(0x0001, 0x330);
            tools.recompressDMAFileIntoRom(evt.rom, 401, stick);
        }
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
                    if (this.ModLoader.ImGui.menuItem("Allow Adult to use crawlspaces", undefined, this.config.allowAdultToUseCrawlspace, true)){
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

}

export interface Code {
    type: string;
    addr: number;
    payload: number;
}

export interface BackupCode {
    code: string;
}

export class GameSharkBackup {
    static backup_gs(data: Buffer, dest: IMemory) {
        let backup = { code: "" } as BackupCode;
        let original: string = data.toString();
        let lines = original.split(/\r?\n/);
        let commands = {
            codes: [] as Code[],
        };
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].substr(0, 2) === '--') {
                continue;
            }
            let a = lines[i].substr(0, 2);
            let b = lines[i].substr(2, lines[i].length);
            let c = parseInt('0x' + b.split(' ')[0], 16);
            let d = parseInt('0x' + b.split(' ')[1], 16);
            commands.codes.push({ type: a, addr: c, payload: d });
        }
        for (let i = 0; i < commands.codes.length; i++) {
            if (commands.codes[i].type === '80') {
                let original = dest.rdramRead8(commands.codes[i].addr);
                backup.code += "80" + commands.codes[i].addr.toString(16).toUpperCase() + " " + original.toString(16) + "\n";
            } else if (commands.codes[i].type === '81') {
                let original = dest.rdramRead16(commands.codes[i].addr);
                backup.code += "81" + commands.codes[i].addr.toString(16).toUpperCase() + " " + original.toString(16) + "\n";
            }
        }
        return backup;
    }
}


module.exports = ChildGear;