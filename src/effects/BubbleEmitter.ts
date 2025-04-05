import Phaser from "phaser";
import * as C from "../config/constants";

export default class BubbleEmitter {
  private scene: Phaser.Scene;
  private bubbleTextureKey: string = C.ASSETS.BUBBLE_PARTICLE_TEXTURE;
  private spawnTimer: Phaser.Time.TimerEvent | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  create(): void {
    this.createBubbleTexture();
    this.startSpawning();
  }

  private createBubbleTexture(): void {
    if (this.scene.textures.exists(this.bubbleTextureKey)) return;

    const size = 16;
    const radius = size * 0.3;

    const graphics = this.scene.make.graphics({ x: 0, y: 0 });

    graphics.fillStyle(0xffffff, 0.3);
    graphics.fillCircle(size / 2, size / 2, radius);
    graphics.lineStyle(1, 0xffffff, 0.5);
    graphics.strokeCircle(size / 2, size / 2, radius);

    graphics.generateTexture(this.bubbleTextureKey, size, size);
    graphics.destroy();
  }

  private startSpawning(): void {
    if (this.spawnTimer) this.spawnTimer.remove();
    this.spawnTimer = this.scene.time.addEvent({
      delay: 500,
      loop: true,
      callback: this.spawnBubble,
      callbackScope: this,
    });
  }

  stopSpawning(): void {
    this.spawnTimer?.remove();
    this.spawnTimer = null;
  }

  spawnBubble(playerSprite?: Phaser.GameObjects.Sprite): void {
    const player = playerSprite ?? (this.scene as any).player?.sprite;
    if (!player?.active) return;

    const x = Phaser.Math.Between(player.x - 15, player.x + 15);
    const y = player.y + 10;

    const bubble = this.scene.physics.add.image(x, y, this.bubbleTextureKey);
    if (!bubble?.body) return;

    bubble.setVelocity(
      Phaser.Math.Between(-10, 10),
      Phaser.Math.Between(-60, -30)
    );
    (bubble.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    bubble
      .setAlpha(Phaser.Math.FloatBetween(0.2, 0.6))
      .setScale(Phaser.Math.FloatBetween(0.3, 0.8))
      .setDepth(C.DEPTH_PLAYER - 1)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.scene.tweens.add({
      targets: bubble,
      alpha: 0,
      scale: bubble.scale * 0.5,
      duration: Phaser.Math.Between(2000, 4000),
      ease: "Sine.easeIn",
      onComplete: () => {
        if (bubble.active) {
          bubble.destroy();
        }
      },
    });
  }

  destroy(): void {
    this.stopSpawning();
  }
}
