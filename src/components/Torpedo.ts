import Phaser from "phaser";
import { TorpedoType, TorpedoConfig, ITorpedoConfig } from "./TorpedoTypes";
import * as C from "../config/constants";
import BackgroundManager from "./BackgroundManager";
import { v4 } from "uuid";

export default class SingleTorpedo {
  public id: string;
  public sprite!: Phaser.Physics.Arcade.Sprite;
  public type: TorpedoType;
  protected scene: Phaser.Scene;
  private config: ITorpedoConfig;
  private isActiveState: boolean = false;
  private light!: Phaser.GameObjects.PointLight | null;
  private backgroundManager: BackgroundManager;
  public hasBeenFired: boolean = false;

  constructor(
    scene: Phaser.Scene,
    type: TorpedoType,
    backgroundManager: BackgroundManager
  ) {
    this.id = v4();
    this.scene = scene;
    this.type = type;
    this.config = TorpedoConfig[type];
    this.backgroundManager = backgroundManager;
    if (!this.config) {
      console.error(
        `Configuration manquante pour le type de torpille: ${type}`
      );
      this.sprite = this.scene.physics.add.sprite(0, 0, "__DEFAULT");
    } else {
      this.sprite = this.scene.physics.add.sprite(0, 0, this.config.textureKey);
    }

    if (this.config?.scale) {
      this.sprite.setScale(this.config.scale);
    }

    this.sprite.setActive(false).setVisible(false);
    this.sprite.setDepth(C.DEPTH_TORPEDO);

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setAllowGravity(false);
      body.setCollideWorldBounds(false);
      body.enable = false;
    }
    this.light = null;
  }

  fireTorpedo(
    startX: number,
    startY: number,
    targetX: number,
    targetY: number,
    type: TorpedoType
  ): void {
    if (this.isActiveState) {
      return;
    }
    if (!this.config) {
      console.error(
        `Tentative de tir d'une torpille sans configuration valide: ${this.type}`
      );
      return;
    }

    this.isActiveState = true;
    this.sprite.setPosition(startX, startY);
    this.sprite.setTexture(this.config.textureKey);
    if (this.config.scale) {
      this.sprite.setScale(this.config.scale);
    }
    this.sprite.setActive(true).setVisible(true);

    const angle = Phaser.Math.Angle.Between(startX, startY, targetX, targetY);
    this.sprite.setRotation(angle + Math.PI / 2); // Ajoute 90 degrés (PI/2 radians)

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    if (body) {
      this.scene.physics.velocityFromRotation(
        angle, 
        this.config.speed,
        body.velocity
      );
      body.enable = true;
    }

    this.light = this.scene.add.pointlight(
      startX,
      startX,
      this.config.lightColor,
      100,
      0.5,
      0.05
    );
    this.hasBeenFired = true;
  }

  isActive(): boolean {
    return this.isActiveState;
  }

  hasActiveLightEffect(): boolean {
    return this.light !== null;
  }

  resetState(): void {
    this.isActiveState = false;

    if (this.sprite) {
      this.sprite.setActive(false).setVisible(false);
      const body = this.sprite.body as Phaser.Physics.Arcade.Body;
      if (body) {
        body.stop();
        body.enable = false;
      }
    }

    if (this.light) {
      this.light.setVisible(false);
    }
  }

  update(time: number, delta: number): void {
    if (this.light) {
      const scrollAmount = C.BACKGROUND_SCROLL_SPEED * (delta / 16.66);

      if (!this.isActiveState) {
        this.light.y -= scrollAmount;
      } else {
        this.light.x = this.sprite.x;
        this.light.y = this.sprite.y;
        this.sprite.y -= scrollAmount;
      }
    }

    if (!this.isActiveState) {
      return;
    }

    const bounds = this.scene.physics.world.bounds;
    const safetyMargin = this.sprite.displayWidth;
    if (
      this.sprite.x < bounds.x - safetyMargin ||
      this.sprite.x > bounds.right + safetyMargin ||
      this.sprite.y < bounds.y - safetyMargin ||
      this.sprite.y > bounds.bottom + safetyMargin
    ) {
      this.resetState();
    }
    const pixel = this.backgroundManager.getTexturePixel(
      this.sprite.x,
      this.sprite.y
    );
    if (pixel && pixel.alpha > C.COLLISION_PIXEL_THRESHOLD) {
      this.explode();
    }
  }

  explode() {
    if (!this.isActiveState) return;

    this.isActiveState = false;

    this.deactivate();

    if (this.light) {
      this.light.radius = 400;
      this.light.intensity = 0.4;
    }
  }

  deactivate() {
    this.isActiveState = false;

    if (this.sprite.body) {
      const body = this.sprite.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(0, 0);
      body.setEnable(false);
    }

    this.sprite.setVisible(false);
    this.sprite.setActive(false);
  }

  public handleHit(
    torpedoSprite: Phaser.Physics.Arcade.Sprite,
    target: Phaser.Physics.Arcade.Sprite
  ): void {
    if (!this.isActiveState) {
      return;
    }
    this.resetState();
  }
}
