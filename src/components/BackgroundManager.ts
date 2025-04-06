import Phaser from "phaser";
import OutlinePipeline from "../shaders/outline";
import * as C from "../config/constants";
import GameScene from "../scenes/GameScene";

export default class BackgroundManager {
  private scene: GameScene;
  private background!: Phaser.GameObjects.TileSprite;
  private backgroundCopy!: Phaser.GameObjects.TileSprite | null;
  private outlinePipelineInstance!: OutlinePipeline | null;
  private sonarTimer: Phaser.Time.TimerEvent | null = null;

  constructor(scene: GameScene) {
    this.scene = scene;
    this.backgroundCopy = null;
  }

  create(outlinePipeline?: OutlinePipeline): void {
    this.outlinePipelineInstance = outlinePipeline || null;

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

    if (this.background.preFX && this.outlinePipelineInstance?.thickness) {
      this.background.preFX.setPadding(this.outlinePipelineInstance.thickness);
    }

    this.trySetOutlineTextureSize();
  }

  private trySetOutlineTextureSize() {
    if (!this.outlinePipelineInstance) return;

    const bgTexture = this.scene.textures.get(C.ASSETS.BACKGROUND_IMAGE);
    if (
      bgTexture &&
      bgTexture.source.length > 0 &&
      bgTexture.source[0]?.width > 0
    ) {
      this.outlinePipelineInstance.setTextureSize(
        bgTexture.source[0].width,
        bgTexture.source[0].height
      );
    } else {
      this.scene.time.delayedCall(100, this.trySetOutlineTextureSize, [], this);
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

    if (
      this.scene.game.renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer &&
      this.outlinePipelineInstance
    ) {
      this.background.setPipeline(this.outlinePipelineInstance);
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

    if (
      this.scene.game.renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer &&
      this.outlinePipelineInstance
    ) {
      if (this.background.pipeline === this.outlinePipelineInstance) {
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
