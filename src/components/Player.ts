import Phaser from "phaser";
import * as C from "../config/constants";

export default class Player {
  private scene: Phaser.Scene;
  public sprite!: Phaser.Physics.Arcade.Sprite;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  create(x: number, y: number): void {
    this.scene.anims.create({
      key: C.ANIMATIONS.SUB_IDLE,
      frames: this.scene.anims.generateFrameNumbers(
        C.ASSETS.SUBMARINE_SPRITESHEET,
        { start: 0, end: 2 }
      ),
      frameRate: 8,
      repeat: -1,
    });

    this.sprite = this.scene.physics.add
      .sprite(x, y, C.ASSETS.SUBMARINE_SPRITESHEET)
      .setDepth(C.DEPTH_PLAYER)
      .setPipeline("Light2D")
      .play(C.ANIMATIONS.SUB_IDLE)
      .setScale(0.1)
      .setCollideWorldBounds(true);

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(false);
  }

  updateMovement(cursors: Phaser.Types.Input.Keyboard.CursorKeys): void {
    if (!this.sprite?.active) return;

    this.sprite.setVelocity(0);
    let targetRotation = 0;

    if (cursors.left?.isDown) {
      this.sprite.setVelocityX(-C.PLAYER_SPEED);
      targetRotation = Phaser.Math.DegToRad(-C.MAX_ROTATION_ANGLE);
    } else if (cursors.right?.isDown) {
      this.sprite.setVelocityX(C.PLAYER_SPEED);
      targetRotation = Phaser.Math.DegToRad(C.MAX_ROTATION_ANGLE);
    }

    const verticalMargin = 50;
    if (cursors.up?.isDown && this.sprite.y > verticalMargin) {
      this.sprite.setVelocityY(-C.PLAYER_SPEED);
    } else if (
      cursors.down?.isDown &&
      this.sprite.y < this.scene.scale.height - verticalMargin
    ) {
      this.sprite.setVelocityY(C.PLAYER_SPEED);
    }

    this.sprite.rotation = Phaser.Math.Linear(
      this.sprite.rotation,
      targetRotation,
      0.1
    );
  }

  getPosition(): Phaser.Math.Vector2 {
    return new Phaser.Math.Vector2(this.sprite.x, this.sprite.y);
  }

  handleCollision(): void {
    if (!this.sprite?.active) return;
    this.sprite.setTint(0xff0000).anims.stop();
  }

  resetState(x: number, y: number): void {
    this.sprite.setPosition(x, y);
    this.sprite.clearTint();
    this.sprite.play(C.ANIMATIONS.SUB_IDLE);
    this.sprite.setVelocity(0);
    this.sprite.rotation = 0;
    this.sprite.setActive(true);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.enable = true;
  }

  disable(): void {
    this.sprite?.setActive(false);
    const body = this.sprite?.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.enable = false;
    }
  }
}
