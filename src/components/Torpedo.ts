import Phaser from "phaser";
import { TorpedoType, TorpedoConfig, ITorpedoConfig } from "./TorpedoTypes";
import * as C from "../config/constants";
import BackgroundManager from "./BackgroundManager";
import { v4 } from "uuid";
import GameScene from "../scenes/GameScene";

export default class SingleTorpedo {
  public id: string;
  public sprite!: Phaser.Physics.Arcade.Sprite;
  public type: TorpedoType;
  protected scene: GameScene;
  private config: ITorpedoConfig;
  private isActiveState: boolean = false;
  private light!: Phaser.GameObjects.PointLight | null;
  private backgroundManager: BackgroundManager;
  public hasBeenFired: boolean = false;
  public hasExploded: boolean = false;
  public bodyIncrease: number = 1;
  constructor(
    scene: GameScene,
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

    this.sprite.setData("torpedoInstance", this);

    if (this.config?.scale) {
      this.sprite.setScale(this.config.scale);
    }

    this.sprite.setActive(false).setVisible(false);
    this.sprite.setDepth(C.DEPTH_TORPEDO);
    this.sprite.setTint(this.config.lightColor);
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
    ).setDepth(C.DEPTH_LIGHT);
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
    const scrollAmount = C.BACKGROUND_SCROLL_SPEED * (delta / 16.66);

    if (this.light) {
     
      if (!this.isActiveState) {
        this.light.y -= scrollAmount;
      } else {
        this.light.x = this.sprite.x;
        this.light.y = this.sprite.y;
      }
      if (this.sprite) {
        this.sprite.y -= scrollAmount;
      }
    }

    if (
      !this.isActiveState &&
      !this.hasExploded &&
      this.sprite.body &&
      this.hasBeenFired
    ) {
      this.bodyIncrease += 10;
      const offsetX =
        (this.sprite.width + this.bodyIncrease) / 2 - this.bodyIncrease;
      const offsetY =
        (this.sprite.height + this.bodyIncrease) / 2 - this.bodyIncrease - scrollAmount;
      this.sprite.body?.setCircle(this.bodyIncrease, offsetX, offsetY);
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

    if (this.light && this.type !== TorpedoType.LIGHT) {
      this.light.destroy();
      this.light = null;
    }

    if (this.type === TorpedoType.LIGHT) {
      this.deactivateAfterAnim();
      if (this.light) {
        this.light.radius = 400;
        this.light.intensity = 0.4;
      }
    } else if (this.type === TorpedoType.EXPLOSION) {
      this.sprite.body?.setCircle(15);
      this.sprite.setScale(2);
      this.sprite.preFX?.addGlow(this.config.lightColor);
      this.sprite.play("explosion");
    } else if (this.type === TorpedoType.SHOCK) {
      this.sprite.setScale(2);
      this.sprite.body?.setCircle(15);
      this.sprite.preFX?.addGlow(this.config.lightColor);
      this.sprite.play("shock");
    }

    this.sprite.on("animationcomplete", this.deactivateAfterAnim, this);

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
  }

  deactivateAfterAnim() {
    this.sprite.off("animationcomplete", this.deactivateAfterAnim, this);
    this.sprite.stop();
    this.sprite.setVisible(false);
    this.sprite.setActive(false);
    this.hasExploded = true;
  }
}
