import { bus, EventHandler } from "modloader64_api/EventHandler";
import { OotOnlineEvents, OotOnline_ModelAllocation } from "./OotOAPI";
import fs from 'fs';
import { Postinit } from "modloader64_api/PluginLifecycle";
import { Age, OotEvents } from "modloader64_api/OOT/OOTAPI";
import { IModLoaderAPI } from "modloader64_api/IModLoaderAPI";
import { ModLoaderAPIInject } from 'modloader64_api/ModLoaderAPIInjector';

export class OotOModelSupport {

    @ModLoaderAPIInject()
    ModLoader!: IModLoaderAPI;
    child!: Buffer;
    adult!: Buffer;
    child_alloc!: OotOnline_ModelAllocation;
    adult_alloc!: OotOnline_ModelAllocation;

    @EventHandler(OotOnlineEvents.CUSTOM_MODEL_APPLIED_ADULT)
    onModelLoad1(file: string) {
        this.adult = fs.readFileSync(file);
    }

    @EventHandler(OotOnlineEvents.CUSTOM_MODEL_APPLIED_CHILD)
    onModelLoad2(file: string) {
        this.child = fs.readFileSync(file);
    }

    @EventHandler(OotOnlineEvents.CUSTOM_MODEL_LOAD_BUFFER_ADULT)
    onCustomModelBufferAdult(buf: Buffer) {
        this.adult = buf;
    }

    @EventHandler(OotOnlineEvents.CUSTOM_MODEL_LOAD_BUFFER_CHILD)
    onCustomModelBufferChild(buf: Buffer) {
        this.child = buf;
    }

    @EventHandler(OotOnlineEvents.CUSTOM_MODEL_OVERRIDE_ADULT)
    onOverrideAdult(evt: any) {
        this.adult = fs.readFileSync(evt.p);
    }

    @EventHandler(OotOnlineEvents.CUSTOM_MODEL_OVERRIDE_CHILD)
    onOverrideChild(evt: any) {
        this.child = fs.readFileSync(evt.p);
    }

    @Postinit()
    setupModelSupport() {
        if (this.child !== undefined) {
            this.ModLoader.logger.info("Detected child custom model.");
            this.child.writeUInt32BE(0x060053A8, 0x500C);
            let evt = new OotOnline_ModelAllocation(this.child, Age.CHILD);
            bus.emit(OotOnlineEvents.ALLOCATE_MODEL_BLOCK, evt);
            this.child_alloc = evt;
            bus.emit(OotOnlineEvents.FORCE_LOAD_MODEL_BLOCK, this.child_alloc.slot);
        }
        if (this.adult !== undefined) {
            this.ModLoader.logger.info("Detected adult custom model");
            this.adult.writeUInt32BE(0x06005380, 0x500C);
            let evt = new OotOnline_ModelAllocation(this.adult, Age.ADULT);
            bus.emit(OotOnlineEvents.ALLOCATE_MODEL_BLOCK, evt);
            this.adult_alloc = evt;
            bus.emit(OotOnlineEvents.FORCE_LOAD_MODEL_BLOCK, this.adult_alloc.slot);
        }
    }

    ageChangeCallback() {
        let start = 0x80854E20;
        if (this.adult_alloc !== undefined) {
            // Hand
            let hand = 0xE4;
            this.ModLoader.emulator.rdramWrite32(start + hand, (this.adult_alloc.pointer + 0x5128));
            // Megaton Hammer
            let mega = 0x4;
            this.ModLoader.emulator.rdramWrite32(start + mega, (this.adult_alloc.pointer + 0x5170));
            // Mirror Shield
            let mirror_back = 0x14;
            let mirror_in_hand = 0x24;
            this.ModLoader.emulator.rdramWrite32(start + mirror_back, (this.adult_alloc.pointer + 0x5288));
            this.ModLoader.emulator.rdramWrite32(start + mirror_in_hand, (this.adult_alloc.pointer + 0x5168));
            // Master Sword
            let master_sword_hilt = 0x34;
            let master_sword_blade = 0x3C;
            this.ModLoader.emulator.rdramWrite32(start + master_sword_hilt, (this.adult_alloc.pointer + 0x5138));
            this.ModLoader.emulator.rdramWrite32(start + master_sword_blade, (this.adult_alloc.pointer + 0x5140));
            // Biggoron's Sword
            let biggoron_hilt = 0x44;
            let biggoron_blade = 0x4C;
            this.ModLoader.emulator.rdramWrite32(start + biggoron_hilt, (this.adult_alloc.pointer + 0x5148));
            this.ModLoader.emulator.rdramWrite32(start + biggoron_blade, (this.adult_alloc.pointer + 0x5150));
             // Hookshot 3P
            let hookshot_3p = 0x114;
            this.ModLoader.emulator.rdramWrite32(start + hookshot_3p, (this.adult_alloc.pointer + 0x5190));
            // Hookshot 1P
            let hookshot_1P = 0x134;
            this.ModLoader.emulator.rdramWrite32(start + hookshot_1P, (this.adult_alloc.pointer + 0x5208));
            // Deku Shield
            let sheath = 0x7C;
            this.ModLoader.emulator.rdramWrite32(start + sheath, (this.adult_alloc.pointer + 0x5238));
        }
        if (this.child_alloc !== undefined) {
            // Hand
            let hands = 0xD4;
            this.ModLoader.emulator.rdramWrite32(start + hands, ((this.child_alloc.pointer + 0x5158)));
            // Deku Shield
            let deku_shield_back = 0x84;
            this.ModLoader.emulator.rdramWrite32(start + deku_shield_back, (this.child_alloc.pointer + 0x5278));
            // Deku Stick
            let stick = 0x9C;
            this.ModLoader.emulator.rdramWrite32(start + stick, (this.child_alloc.pointer + 0x51A8));
            // Boomerang
            let boom = 0xCC;
            this.ModLoader.emulator.rdramWrite32(start + boom, (this.child_alloc.pointer + 0x5328));
        }
    }
}