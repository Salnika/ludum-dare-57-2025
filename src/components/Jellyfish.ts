import Phaser from "phaser";
import GameScene from "../scenes/GameScene";
import * as C from "../config/constants";

export default class Jellyfish extends Phaser.Physics.Arcade.Sprite {
  private sceneRef: GameScene;
  private timeAlive: number = 0;
  private driftingCenterX: number;
  private baseHorizontalSpeed: number;
  private isAffectedBySonar: boolean = false;
  private sonarTimer: Phaser.Time.TimerEvent | null = null;
  private copy: Phaser.GameObjects.Sprite | null = null;
  public isDying: boolean = false;
  public isGlowing: boolean = false;

  constructor(scene: GameScene, x: number, y: number) {
    super(scene, x, y, C.ASSETS.JELLYFISH_SPRITESHEET);
    this.sceneRef = scene;
    this.driftingCenterX = x;
    this.baseHorizontalSpeed =
      x > scene.scale.width / 2
        ? -Math.abs(C.JELLYFISH_HORIZONTAL_SPEED)
        : Math.abs(C.JELLYFISH_HORIZONTAL_SPEED);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setActive(false);
    this.setVisible(false);
  }

  init() {
    this.setActive(true);
    this.setVisible(true);
    if (this.body) {
      this.setCollideWorldBounds(false);
      this.setDepth(C.DEPTH_ENEMY);
      this.setPipeline("Light2D");
    }
    this.play("jellyfish_idle");
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);

    if (this.isDying || !this.active) return;

    this.timeAlive += delta;

    const scrollAmount = C.BACKGROUND_SCROLL_SPEED * (delta / 16.66);
    this.y -= scrollAmount;

    if (this.copy) {
      this.copy.x = this.x;
      this.copy.y = this.y;
    }

    this.driftingCenterX += this.baseHorizontalSpeed * (delta / 1000);
    this.x =
      this.driftingCenterX +
      C.JELLYFISH_AMPLITUDE * Math.sin(C.JELLYFISH_FREQUENCY * this.timeAlive);
    if (!this.isAffectedBySonar) {
      if (
        this.anims.currentAnim?.key !== "jellyfish_swim" &&
        this.anims.currentAnim?.key !== "jellyfish_swim2"
      ) {
        const anim = Math.random() < 0.5 ? "jellyfish_swim" : "jellyfish_swim2";
        this.play(anim, true);
        if (this.copy) {
          this.copy.play(anim, true);
        }
      }
    }

    if (!this.body) return;
    this.body.velocity.y = -scrollAmount / (delta / 1000);
    this.body.velocity.x = 0;

    if (this.y < -this.displayHeight) {
      this.destroy();
    }
  }

  applySonarEffect(): void {
    if (this.isDying || this.isGlowing) return;
    const anim = Math.random() < 0.5 ? "jellyfish_swim" : "jellyfish_swim2";

    this.play(anim);
    if (!this.copy) {
      this.copy = this.sceneRef.add
        .sprite(this.x, this.y, C.ASSETS.JELLYFISH_SPRITESHEET)
        .setOrigin(0.5, 0.5)
        .setDepth(C.DEPTH_ENEMY + 1)
        .setPipeline("Light2D")
        .setAlpha(1)
        .play(this.sceneRef.anims.exists(anim) ? anim : "jellyfish_idle");
    } else {
      this.copy
        .setPosition(this.x, this.y)
        .setAlpha(1)
        .setVisible(true)
        .play(this.sceneRef.anims.exists(anim) ? anim : "jellyfish_idle");
    }

    // @ts-expect-error
    this.preFX.addGlow(0x00ff00, 3); 
    this.isGlowing = true;

    if (!this.sonarTimer) {
      this.sonarTimer = this.sceneRef.time.addEvent({
        delay: C.JELLYFISH_SONAR_DURATION,
        callback: () => this.removeSonarEffect(),
        callbackScope: this,
      });
    }
  }

  removeSonarEffect(): void {
    this.isAffectedBySonar = false;

    // @ts-expect-error
    this.preFX.clear();
    this.isGlowing = false;

    if (this.sonarTimer) {
      this.sonarTimer.remove(false);
      this.sonarTimer = null;
    }
  }

  public die(): void {
    if (this.isDying) return;

    this.isDying = true;
    if (this.body) this.body.enable = false;

    if (this.sonarTimer) {
      this.sonarTimer.remove(false);
      this.sonarTimer = null;
    }
    this.isAffectedBySonar = false;

    this.play("jellyfish_die", true);
    this.copy?.play("jellyfish_die", true);
    this.on(
      Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + "jellyfish_die",
      () => {
        this.copy?.destroy();
        this.destroy();
      },
      this
    );

    if (this.body) {
      this.body.velocity.x = 0;
      this.body.velocity.y = 0;
    }

    if (this.copy && this.copy.active) {
      this.copy.destroy();
    }
  }

  destroy(fromScene?: boolean): void {
    if (this.sonarTimer) {
      this.sonarTimer.remove(false);
      this.sonarTimer = null;
    }
    if (this.copy) {
      this.copy.destroy();
      this.copy = null;
    }
    super.destroy(fromScene);
  }
}
