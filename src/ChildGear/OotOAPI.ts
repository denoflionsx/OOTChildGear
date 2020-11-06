import { Age } from "modloader64_api/OOT/OOTAPI";

export enum OotOnlineEvents {
    PLAYER_PUPPET_PRESPAWN = 'OotOnline:onPlayerPuppetPreSpawned',
    PLAYER_PUPPET_SPAWNED = 'OotOnline:onPlayerPuppetSpawned',
    PLAYER_PUPPET_DESPAWNED = 'OotOnline:onPlayerPuppetDespawned',
    PLAYER_PUPPET_QUERY = "OotOnline:PlayerPuppetQuery",
    SERVER_PLAYER_CHANGED_SCENES = 'OotOnline:onServerPlayerChangedScenes',
    CLIENT_REMOTE_PLAYER_CHANGED_SCENES = 'OotOnline:onRemotePlayerChangedScenes',
    GHOST_MODE = 'OotOnline:EnableGhostMode',
    GAINED_HEART_CONTAINER = 'OotOnline:GainedHeartContainer',
    GAINED_PIECE_OF_HEART = 'OotOnline:GainedPieceOfHeart',
    MAGIC_METER_INCREASED = 'OotOnline:GainedMagicMeter',
    CUSTOM_MODEL_APPLIED_ADULT = 'OotOnline:ApplyCustomModelAdult',
    CUSTOM_MODEL_APPLIED_CHILD = 'OotOnline:ApplyCustomModelChild',
    CUSTOM_MODEL_APPLIED_ANIMATIONS = 'OotOnline:ApplyCustomAnims',
    CUSTOM_MODEL_APPLIED_ICON_ADULT = 'OotOnline:ApplyCustomIconAdult',
    CUSTOM_MODEL_APPLIED_ICON_CHILD = 'OotOnline:ApplyCustomIconChild',
    CUSTOM_MODEL_OVERRIDE_ADULT = 'OotOnline:OverrideCustomModelAdult',
    CUSTOM_MODEL_OVERRIDE_CHILD = 'OotOnline:OverrideCustomModelChild',
    ON_INVENTORY_UPDATE = 'OotOnline:OnInventoryUpdate',
    ON_EXTERNAL_ACTOR_SYNC_LOAD = 'OotOnline:OnExternalActorSyncLoad',
    ON_REGISTER_EMOTE = 'OotOnline:OnRegisterEmote',
    ON_LOAD_SOUND_PACK = "OotOnline:OnLoadSoundPack",
    ON_REMOTE_SOUND_PACK = "OotOnline:OnRemoteSoundPack",
    ON_REMOTE_PLAY_SOUND = "OotOnline:OnRemotePlaySound",
    CUSTOM_MODEL_LOAD_BUFFER_ADULT = "OotOnline:ApplyCustomModelAdultBuffer",
    CUSTOM_MODEL_LOAD_BUFFER_CHILD = "OotOnline:ApplyCustomModelChildBuffer",
    ALLOCATE_MODEL_BLOCK = "OotOnline:AllocateModelBlock",
    FORCE_LOAD_MODEL_BLOCK = "OotOnline:ForceLoadModelBlock"
  }

  export class OotOnline_ModelAllocation{
    model: Buffer;
    age: Age;
    slot!: number;
    pointer!: number;
  
    constructor(model: Buffer, age: Age){
      this.model = model;
      this.age = age;
    }
  }