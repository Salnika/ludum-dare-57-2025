import Phaser from "phaser";
import Player from "../components/Player";
import Torpedo from "../components/TorpedoManager";
import Jellyfish from "../components/Jellyfish";
import BackgroundManager from "../components/BackgroundManager";
import Sonar from "../components/Sonar";
import BubbleEmitter from "../effects/BubbleEmitter";
import * as C from "../config/constants";

export default class CollisionManager {
  constructor(
    private scene: Phaser.Scene,
    private player: Player,
    private torpedoManager: Torpedo,
    private jellyfishGroup: Phaser.Physics.Arcade.Group,
    private backgroundManager: BackgroundManager,
    private sonar: Sonar,
    private bubbleEmitter: BubbleEmitter,
    private jellyfishSpawnTimer: Phaser.Time.TimerEvent
  ) {
  }

  setupCollisions(): void {
    /* const torpedoGroup = this.torpedoManager.getGroup();
    if (torpedoGroup) {
      this.scene.physics.add.overlap(
        torpedoGroup,
        this.jellyfishGroup,
        this.handleTorpedoJellyfishCollision,
        undefined,
        this
      );
    } else {
      console.warn("Could not get torpedo group for collision setup.");
    } */
    /*
    this.scene.physics.add.overlap(
      this.player.getSprite(),
      this.jellyfishGroup,
      this.handlePlayerJellyfishCollision,
      undefined,
      this
    );
    */
  }

  handlePlayerJellyfishCollision(
    playerSprite: Phaser.GameObjects.GameObject,
    jellyfishGameObject: Phaser.GameObjects.GameObject
  ): void {
    const jellyfish = jellyfishGameObject as Jellyfish;
    if (this.scene.getIsGameOver() || jellyfish.isDying) {
      return;
    }
    jellyfish.die();
    this.handlePlayerCollision();
  }

  handleTorpedoJellyfishCollision(
    torpedoGameObject: Phaser.GameObjects.GameObject,
    jellyfishGameObject: Phaser.GameObjects.GameObject
  ): void {
    const jellyfish = jellyfishGameObject as Jellyfish;
    const torpedoSprite = torpedoGameObject as Phaser.Physics.Arcade.Sprite;
    const torpedoInstance = torpedoSprite.getData(
      "instance"
    ) as import("../components/Torpedo").default;

    if (
      !jellyfish.active ||
      jellyfish.isDying ||
      !torpedoSprite.active ||
      !torpedoInstance ||
      !torpedoInstance.isActive()
    ) {
      return;
    }

    jellyfish.die();

    if (torpedoInstance.explode) {
      torpedoInstance.explode();
    } else {
      torpedoSprite.destroy();
    }
  }

  checkPlayerPixelCollision(): void {
    const playerBounds = this.player.getSprite().getBounds();
    const checkPoints = [
      { x: playerBounds.centerX, y: playerBounds.centerY },
      { x: playerBounds.left + 5, y: playerBounds.centerY },
      { x: playerBounds.right - 5, y: playerBounds.centerY },
      { x: playerBounds.centerX, y: playerBounds.top + 5 },
      { x: playerBounds.centerX, y: playerBounds.bottom - 5 },
    ];

    for (const point of checkPoints) {
      const pixel = this.backgroundManager.getTexturePixel(point.x, point.y);
      if (pixel && pixel.alpha > C.COLLISION_PIXEL_THRESHOLD) {
        this.handlePlayerCollision();
        return;
      }
    }
  }

  handlePlayerCollision(): void {
    if (this.scene.getIsGameOver()) return;

    this.scene.setGameOver(true);
    this.scene.physics.pause();
    this.player.handleCollision();
    this.scene.cameras.main.shake(300, 0.01);
    this.bubbleEmitter.stopSpawning();
    if (this.jellyfishSpawnTimer) this.jellyfishSpawnTimer.paused = true;

    this.sonar.deactivate(() => {
      this.backgroundManager.removeSonarEffect();
    });
    this.backgroundManager.removeSonarEffect();

    this.jellyfishGroup.children.each(
      (jellyfishGO: Phaser.GameObjects.GameObject) => {
        const jellyfish = jellyfishGO as Jellyfish;
        if (jellyfish.active) {
          this.scene.tweens.add({
            targets: jellyfish,
            alpha: 0,
            duration: 500,
          });
          if (jellyfish.body)
            (jellyfish.body as Phaser.Physics.Arcade.Body).stop();
        }
        return true;
      }
    );

    this.scene.time.addEvent({
      delay: 1500,
      callback: () => {
        if (this.scene.physics.world) this.scene.physics.resume();
        this.scene.scene.restart();
      },
      loop: false,
    });
  }
}
