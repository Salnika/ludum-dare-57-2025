import Phaser from "phaser";
import BackgroundManager from "./BackgroundManager";
import { TorpedoType } from "./TorpedoTypes";
import * as C from "../config/constants";

const TORPEDO_SCALE = 0.2;
const TORPEDO_ANGLE_OFFSET_RAD = Math.PI / 2;
const TORPEDO_SPEED_MULTIPLIER = 2;

export default class SingleTorpedo {
    private scene: Phaser.Scene;
    private backgroundManager: BackgroundManager;
    private sprite: Phaser.GameObjects.Sprite;
    private active: boolean = false;
    private torpedoLight!: Phaser.GameObjects.PointLight;
    private type: TorpedoType | null = null;
    private initialScrollOffset: number = 0;
  
    constructor(scene: Phaser.Scene, backgroundManager: BackgroundManager) {
      this.scene = scene;
      this.backgroundManager = backgroundManager;
      this.sprite = this.scene.add.sprite(0, 0, C.ASSETS.TORPEDO_SPRITE);
      this.sprite.setVisible(false);
      this.sprite.setActive(false);
      this.sprite.setScale(TORPEDO_SCALE);
  
      this.scene.physics.world.enable(this.sprite);
      (this.sprite.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    }
  
    isActive(): boolean {
      return this.active;
    }
  
    hasActiveLight(): boolean {
      return this.torpedoLight !== undefined && this.torpedoLight.active;
    }
  
    fireTorpedo(
      startX: number,
      startY: number,
      targetX: number,
      targetY: number,
      type: TorpedoType
    ) {
      this.type = type;
      this.active = true;
  
      this.sprite.setPosition(startX, startY);
      this.torpedoLight = this.scene.add
        .pointlight(startX, startY, 0xA8D5BA, 100, 0.5, 0.05)
        .setDepth(C.DEPTH_LIGHT);
      this.sprite.setVisible(true);
      this.sprite.setActive(true);
      (this.sprite.body as Phaser.Physics.Arcade.Body).setEnable(true);
  
      this.sprite.setScale(TORPEDO_SCALE);
  
      const angleRad = Math.atan2(targetY - startY, targetX - startX);
      this.sprite.rotation = angleRad + TORPEDO_ANGLE_OFFSET_RAD;
  
      this.scene.physics.velocityFromRotation(
        angleRad,
        200 * TORPEDO_SPEED_MULTIPLIER,
        (this.sprite.body as Phaser.Physics.Arcade.Body).velocity
      );
    }
  
    update(time: number, delta: number) {
      if (!this.active && !this.torpedoLight) return;
  
      const currentScrollOffset = this.backgroundManager.getScrollY();
      const scrollDifference = currentScrollOffset - this.initialScrollOffset;
  
      if (!this.active) {
        this.torpedoLight.y -= scrollDifference;
      } else {
        this.torpedoLight.x = this.sprite.x;
        this.torpedoLight.y = this.sprite.y;
        this.sprite.y -= scrollDifference;
      }
  
      this.initialScrollOffset = currentScrollOffset;
      const bounds = this.scene.cameras.main.worldView;
      if (this.torpedoLight.y < 0) {
          this.torpedoLight.destroy()
      }
      if (
        this.sprite.x < bounds.x - this.sprite.displayWidth ||
        this.sprite.x > bounds.right + this.sprite.displayWidth ||
        this.sprite.y < bounds.y - this.sprite.displayHeight ||
        this.sprite.y > bounds.bottom + this.sprite.displayHeight
      ) {
        this.deactivate();
        this.torpedoLight.destroy();
        return;
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
      if (!this.active) return;
  
      this.active = false;
  
      this.deactivate();
  
      if (this.torpedoLight) {
        this.torpedoLight.radius = 400;
        this.torpedoLight.intensity = 0.4;
      }
  
    }
  
    deactivate() {
      this.type = null;
      this.active = false;
  
      if (this.sprite.body) {
        const body = this.sprite.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(0, 0);
        body.setEnable(false);
      }
  
      this.sprite.setVisible(false);
      this.sprite.setActive(false);
    }
  }