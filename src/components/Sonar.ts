import Phaser from "phaser";
import * as C from "../config/constants";
import GameScene from "../scenes/GameScene";
import PipelineManager from "../scenes/PipelineManager";

export default class Sonar {
  private scene: GameScene;
  private graphics!: Phaser.GameObjects.Graphics;
  public sound!: Phaser.Sound.BaseSound;
  private active: boolean = false;
  private radius: number = 0;
  private currentPosition: Phaser.Math.Vector2 = new Phaser.Math.Vector2();
  private maxSonarRadius: number = C.MAX_SONAR_RADIUS;
  public energy: number = 100;
  public sonarBonus: number = 0;
  private pipelineManager: PipelineManager;

  constructor(scene: GameScene, pipelineManager: PipelineManager) {
    this.scene = scene;
    this.pipelineManager = pipelineManager;
  }

  create(): void {
    this.graphics = this.scene.add
      .graphics()
      .setDepth(C.DEPTH_SONAR)
      .setVisible(false);

    this.sound = this.scene.sound.add(C.ASSETS.SONAR_PING_SOUND, {
      volume: 0.5,
      loop: false,
    });
  }

  activate(position: Phaser.Math.Vector2): void {
    if (this.active || !this.energy) return;
    this.active = true;
    this.radius = 1;
    this.currentPosition.copy(position);
    this.energy -= 5;
    this.graphics
      .setVisible(true)
      .setAlpha(1)
      .clear()
      .lineStyle(2, 0x00ff00, 1.0)
      .strokeCircle(
        this.currentPosition.x,
        this.currentPosition.y,
        this.radius
      );

    this.sound.play();

    const outlinePipeline = this.pipelineManager.getOutlinePipeline();
    if (outlinePipeline) {
      outlinePipeline.setSonarProperties(
        this.currentPosition.x,
        this.currentPosition.y,
        this.radius,
        true
      );
    }
  }

  deactivate(onCompleteCallback?: () => void): void {
    if (!this.active) return;
    this.active = false;
    this.radius = 0;

    this.scene.tweens.add({
      targets: this.graphics,
      alpha: 0,
      duration: 300,
      ease: "Linear",
      onComplete: () => {
        if (this.graphics) {
          this.graphics.setVisible(false).clear();
        }
        onCompleteCallback?.();
      },
    });
    const outlinePipeline = this.pipelineManager.getOutlinePipeline();
    if (outlinePipeline) {
      outlinePipeline.setSonarProperties(0, 0, 0, false);
    }
  }
  update(dt: number): void {
    if (!this.active) return;

    this.currentPosition.y -= C.BACKGROUND_SCROLL_SPEED * (dt / 16.66);
    this.radius += C.SONAR_SPEED * dt;
    const sonarProgress = this.radius / this.maxSonarRadius + this.sonarBonus;
    const sonarAlpha = Math.max(0, 1 - sonarProgress * 0.8);

    this.graphics.clear();

    this.graphics
      .lineStyle(2, 0x00ff00, sonarAlpha)
      .strokeCircle(
        this.currentPosition.x,
        this.currentPosition.y,
        this.radius
      );

    const secondaryRadius = Math.max(0, this.radius - C.SECONDARY_SONAR_OFFSET);
    if (secondaryRadius > 0) {
      this.graphics
        .lineStyle(1, 0x00ff00, sonarAlpha)
        .strokeCircle(
          this.currentPosition.x,
          this.currentPosition.y,
          secondaryRadius
        );
    }

    const thirdRadius = Math.max(0, this.radius - C.SECONDARY_SONAR_OFFSET * 2);
    if (thirdRadius > 0) {
      this.graphics
        .lineStyle(1, 0x00ff00, sonarAlpha * 0.8)
        .strokeCircle(
          this.currentPosition.x,
          this.currentPosition.y,
          thirdRadius
        );
    }
    const outlinePipeline = this.pipelineManager.getOutlinePipeline();
    if (outlinePipeline) {
      outlinePipeline.setSonarProperties(
        this.currentPosition.x,
        this.currentPosition.y,
        this.radius,
        true
      );
    }

    if (this.radius >= this.maxSonarRadius + this.sonarBonus) {
      this.deactivate();
    }
  }

  isActive(): boolean {
    return this.active;
  }

  getCurrentRadius(): number {
    return this.radius;
  }

  getCurrentPosition(): Phaser.Math.Vector2 {
    return this.currentPosition;
  }
}
