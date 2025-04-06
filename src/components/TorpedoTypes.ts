export enum TorpedoType {
  LIGHT = "LIGHT",
  SHOCK = "SHOCK",
  EXPLOSION = "EXPLOSION",
}

export interface ITorpedoConfig {
  speed: number;
  textureKey: string;
  damage?: number;
  lightColor?: number;
  lightRadius?: number;
  explosionEffectKey?: string;
  stunDuration?: number;
  scale?: number;
  lightIntensity?: number;
}

export const TorpedoConfig: { [key in TorpedoType]: ITorpedoConfig } = {
  [TorpedoType.LIGHT]: {
    speed: 400,
    textureKey: "torpedo",
    lightColor: 0xffffdd,
    lightRadius: 80,
    lightIntensity: 1.5,
    scale: 0.2  ,
  },
  [TorpedoType.SHOCK]: {
    speed: 300,
    textureKey: "torped",
    lightColor: 0xaaaaff,
    lightRadius: 60,
    stunDuration: 2000,
    lightIntensity: 1.5,
  },
  [TorpedoType.EXPLOSION]: {
    speed: 350,
    textureKey: "torped",
    lightColor: 0xffaaaa,
    lightRadius: 100,
    explosionEffectKey: "explosion_anim",
    lightIntensity: 1.5,
    damage: 50,
  },
};
