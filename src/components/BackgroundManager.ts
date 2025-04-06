import Phaser from "phaser";
import * as C from "../config/constants";
import GameScene from "../scenes/GameScene";
import PipelineManager from "../scenes/PipelineManager";

export default class BackgroundManager {
  private scene: GameScene;
  private background!: Phaser.GameObjects.TileSprite;
  private backgroundCopy!: Phaser.GameObjects.TileSprite | null;
  private sonarTimer: Phaser.Time.TimerEvent | null = null;
  private pipelineManager: PipelineManager;

  constructor(scene: GameScene, pipelineManager: PipelineManager) {
    this.scene = scene;
    this.backgroundCopy = null;
    this.pipelineManager = pipelineManager;
  }

  create(): void {
    this.background = this.scene.add
      .tileSprite(
        0,
        0,
        this.scene.scale.width,
        this.scene.scale.height,
        C.ASSETS.BACKGROUND_IMAGE
      )
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(C.DEPTH_BACKGROUND)
      .setPipeline("Light2D");

    const outlinePipeline = this.pipelineManager.getOutlinePipeline();
    if (this.background.preFX && outlinePipeline?.thickness) {
      this.background.preFX.setPadding(outlinePipeline.thickness);
    }
  }

  updateScroll(delta: number): void {
    const scrollAmount = C.BACKGROUND_SCROLL_SPEED * (delta / 16.66);
    this.background.tilePositionY += scrollAmount;

    if (this.backgroundCopy) {
      this.backgroundCopy.tilePositionY = this.background.tilePositionY;
    }
  }

  applySonarEffect(): void {
    if (!this.backgroundCopy) {
      this.backgroundCopy = this.scene.add
        .tileSprite(
          0,
          0,
          this.scene.scale.width,
          this.scene.scale.height,
          C.ASSETS.BACKGROUND_IMAGE
        )
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(C.DEPTH_BACKGROUND + 1)
        .setPipeline("Light2D")
        .setAlpha(1);
      this.backgroundCopy.tilePositionY = this.background.tilePositionY;
    } else {
      this.backgroundCopy.setAlpha(1).setVisible(true);
    }

    const outlinePipeline = this.pipelineManager.getOutlinePipeline();
    if (
      this.scene.game.renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer &&
      outlinePipeline
    ) {
      this.background.setPipeline(outlinePipeline);
    }

    if (!this.sonarTimer) {
      this.sonarTimer = this.scene.time.addEvent({
        delay: C.JELLYFISH_SONAR_DURATION,
        callback: () => this.removeSonarEffect(),
        callbackScope: this,
      });
    }
  }

  removeSonarEffect(): void {
    if (this.backgroundCopy) {
      const copyToDestroy = this.backgroundCopy;
      this.backgroundCopy = null;

      this.scene.tweens.add({
        targets: copyToDestroy,
        alpha: 0,
        duration: 300,
        ease: "Linear",
        onComplete: () => {
          copyToDestroy?.destroy();
        },
      });
    }
    const outlinePipeline = this.pipelineManager.getOutlinePipeline();

    if (
      this.scene.game.renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer &&
      outlinePipeline
    ) {
      if (this.background.pipeline === outlinePipeline) {
        this.background.resetPipeline(true);
        this.background.setPipeline("Light2D");
      }
    }
  }

  getTexturePixel(worldX: number, worldY: number): Phaser.Display.Color | null {
    if (
      !this.scene.textures.exists(C.ASSETS.BACKGROUND_IMAGE) ||
      !this.background.texture.source[0]?.image
    )
      return null;

    const checkX = Math.floor(worldX);
    const checkY = Math.floor(worldY - this.background.tilePositionY);

    const texWidth = this.background.texture.source[0].width;
    const texHeight = this.background.texture.source[0].height;

    const textureX = Phaser.Math.Wrap(checkX, 0, texWidth);
    const textureY = Phaser.Math.Wrap(checkY, 0, texHeight);

    try {
      return this.scene.textures.getPixel(
        textureX,
        textureY,
        C.ASSETS.BACKGROUND_IMAGE
      );
    } catch (e) {
      return null;
    }
  }

  getScrollX(): number {
    return 0;
  }
  getScrollY(): number {
    return this.background.tilePositionY;
  }
}
