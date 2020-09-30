import { IPlugin, IModLoaderAPI, ModLoaderEvents } from 'modloader64_api/IModLoaderAPI';
import { IOOTCore } from 'modloader64_api/OOT/OOTAPI';
import { InjectCore } from 'modloader64_api/CoreInjection';
import { EventHandler } from 'modloader64_api/EventHandler';
import { Z64RomTools } from 'Z64Lib/API/Z64RomTools';
import { Z64LibSupportedGames } from 'Z64Lib/API/Z64LibSupportedGames';
import { onViUpdate } from 'modloader64_api/PluginLifecycle';

interface ChildGearConfig {
    unlockItemsAsChild: boolean;
}

class ChildGear implements IPlugin {

    ModLoader!: IModLoaderAPI;
    pluginName?: string | undefined;
    @InjectCore()
    core!: IOOTCore;
    kokiri: number = 0x8083CAF8;
    config!: ChildGearConfig;

    preinit(): void {
        this.config = this.ModLoader.config.registerConfigCategory("ChildGear") as ChildGearConfig;
        this.ModLoader.config.setData("ChildGear", "unlockItemsAsChild", true);
    }
    init(): void {
    }
    postinit(): void {
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
                    this.ModLoader.ImGui.text("These settings require a game restart to take effect.");
                    this.ModLoader.ImGui.endMenu();
                }
                this.ModLoader.ImGui.endMenu();
            }
            this.ModLoader.ImGui.endMainMenuBar();
        }
    }

}

module.exports = ChildGear;