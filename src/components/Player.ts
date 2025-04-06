import Phaser from "phaser";
import * as C from "../config/constants";
import GameScene from "../scenes/GameScene";

export default class Player {
  private scene: GameScene;
  public sprite!: Phaser.Physics.Arcade.Sprite;
  public hullLife: number = 1 ;
  public isInvincible: boolean = false;
  private originalPosition!: { x: number; y: number };
  constructor(scene: GameScene) {
    this.scene = scene;
  }

  create(x: number, y: number): void {
    if (!this.scene.anims.exists(C.ANIMATIONS.SUB_IDLE)) {
      this.scene.anims.create({
        key: C.ANIMATIONS.SUB_IDLE,
        frames: this.scene.anims.generateFrameNumbers(
          C.ASSETS.SUBMARINE_SPRITESHEET,
          { start: 0, end: 2 }
        ),
        frameRate: 8,
        repeat: -1,
      });
    }
    this.originalPosition = { x, y };
    this.sprite = this.scene.physics.add
      .sprite(x, y, C.ASSETS.SUBMARINE_SPRITESHEET)
      .setDepth(C.DEPTH_PLAYER)
      .setPipeline("Light2D")
      .play(C.ANIMATIONS.SUB_IDLE)
      .setCollideWorldBounds(true);

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;

    body.setAllowGravity(false);
    body.setImmovable(false);
  }

  updateMovement(cursors: Phaser.Types.Input.Keyboard.CursorKeys): void {
    if (!this.sprite?.active) return;

    const keyQ = this.scene.input.keyboard?.addKey(
      Phaser.Input.Keyboard.KeyCodes.A
    );
    const keyD = this.scene.input.keyboard?.addKey(
      Phaser.Input.Keyboard.KeyCodes.D
    );
    const keyZ = this.scene.input.keyboard?.addKey(
      Phaser.Input.Keyboard.KeyCodes.W
    );
    const keyS = this.scene.input.keyboard?.addKey(
      Phaser.Input.Keyboard.KeyCodes.S
    );

    this.sprite.setVelocity(0);
    let targetRotation = 0;

    const verticalMargin = 50;

    let horizontalInput = 0;
    let verticalInput = 0;

    if (keyQ?.isDown) {
      horizontalInput = -1;
      targetRotation = Phaser.Math.DegToRad(-C.MAX_ROTATION_ANGLE);
    } else if (keyD?.isDown) {
      horizontalInput = 1;
      targetRotation = Phaser.Math.DegToRad(C.MAX_ROTATION_ANGLE);
    }

    if (keyZ?.isDown && this.sprite.y > verticalMargin) {
      verticalInput = -1;
    } else if (
      keyS?.isDown &&
      this.sprite.y < this.scene.scale.height - verticalMargin
    ) {
      verticalInput = 1;
    }

    const gamepads = this.scene.input.gamepad?.getAll();
    if (gamepads?.length) {
      const gamepad = this.scene.input.gamepad?.getPad(gamepads[0].index);
      if (gamepad) {
        horizontalInput = gamepad.axes[0]?.getValue() || horizontalInput;
        verticalInput = gamepad.axes[1]?.getValue() || verticalInput;

        if (horizontalInput < 0) {
          targetRotation = Phaser.Math.DegToRad(-C.MAX_ROTATION_ANGLE);
        } else if (horizontalInput > 0) {
          targetRotation = Phaser.Math.DegToRad(C.MAX_ROTATION_ANGLE);
        }
      }
    }

    this.sprite.setVelocityX(horizontalInput * C.PLAYER_SPEED);
    this.sprite.setVelocityY(verticalInput * C.PLAYER_SPEED);

    this.sprite.rotation = Phaser.Math.Linear(
      this.sprite.rotation,
      targetRotation,
      0.1
    );
  }

  getPosition(): Phaser.Math.Vector2 {
    return new Phaser.Math.Vector2(this.sprite.x, this.sprite.y);
  }

  getSprite(): Phaser.Physics.Arcade.Sprite {
    return this.sprite;
  }

  handleCollision(): void {
    if (!this.sprite?.active || this.isInvincible) return;

    if (this.hullLife > 1) {
      this.hullLife -= 1;
      this.isInvincible = true;
      this.sprite.x = this.originalPosition.x;
      this.sprite.setAlpha(0.5);
      this.scene.time.delayedCall(
        5000,
        () => {
          this.isInvincible = false;
          this.sprite.setAlpha(1);
        },
        [],
        this
      );
    } else {
      this.die();
    }
  }

  die(): void {
    if (!this.sprite?.active) return;

    const particles = this.scene.add
      .particles(this.sprite.x, this.sprite.y, "redPixel", {
        speed: { min: 150, max: 350 },
        angle: { min: 0, max: 360 },
        scale: { start: 2, end: 0 },
        alpha: { start: 1, end: 0 },
        lifespan: { min: 500, max: 1000 },
        quantity: 200,
        blendMode: Phaser.BlendModes.ADD,
      })
      .setDepth(C.DEPTH_PLAYER + 1);

    particles.start();

    this.disable();

    this.scene.time.delayedCall(1000, () => {
      particles.stop();
      particles.destroy();
      this.sprite.destroy();
    });
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
