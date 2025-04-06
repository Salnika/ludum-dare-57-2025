export const MAX_ROTATION_ANGLE: number = 10;
export const SONAR_SPEED: number = 200;
export const MAX_SONAR_RADIUS: number = 350;
export const BACKGROUND_SCROLL_SPEED: number = 1;

export const SECONDARY_SONAR_OFFSET: number = 20;
export const COLLISION_PIXEL_THRESHOLD: number = 10;
export const DEPTH_SONAR: number = 70;
export const DEPTH_TEXT: number = 100;
export const PLAYER_SPEED: number = 200;
export const DEPTH_PLAYER = 5;
export const DEPTH_BACKGROUND = 0;
export const DEPTH_LIGHT = 10;
export const DEPTH_UI = 20;
export const DEPTH_TORPEDO = 8;
export const DEPTH_TORPEDO_LIGHT = 7;
export const DEPTH_ENEMY = 5;

export const COLORS = {
  TORPEDO_SELECTED: "#FFFF00",
  TORPEDO_DEFAULT: "#FFFFFF",
};

export const TORPEDO_POOL_SIZE = 5;
export const TORPEDO_SPEED = 300;
export const TORPEDO_LIFESPAN = 5000;
export const TORPEDO_LIGHT_RADIUS = 250;
export const TORPEDO_LIGHT_INTENSITY = 1.5;
export const TORPEDO_LIGHT_ATTENUATION = 0.02;
export const TORPEDO_LIGHT_COLOR = 0xfff1b5;

export const JELLYFISH_HORIZONTAL_SPEED = -20;
export const JELLYFISH_AMPLITUDE = 40;
export const JELLYFISH_FREQUENCY = 0.005;
export const JELLYFISH_SONAR_DURATION = 2000;

export const ASSETS = {
  SUBMARINE_SPRITESHEET: "submarine",
  BACKGROUND_IMAGE: "background",
  SONAR_PING_SOUND: "sonar-ping",
  BACKGROUND_SOUND: "background-sound",
  BUBBLE_PARTICLE_TEXTURE: "bubble-particle",
  TORPEDO_SPRITE: "torpedo",
  JELLYFISH_SPRITESHEET: "jellyfish-upscale",
  TORPEDO_SOUND: "torpedo-sound",
  EXPLOSION_SPRITESHEET: "explosion",
  SHOCK_SPRITESHEET: "shock",
};

export const ANIMATIONS = {
  SUB_IDLE: "sub_idle",
};

export const PIPELINES = {
  OUTLINE: "OutlinePipeline",
};
