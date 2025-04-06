import Phaser from "phaser";
import Player from "../components/Player";
import Torpedo from "../components/TorpedoManager";
import UIManager from "../ui/UIManager";
import Sonar from "../components/Sonar";
import GameStateManager from "./GameStateManager";
import GameScene from "./GameScene";

export default class InputManager {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private gamepad: Phaser.Input.Gamepad.Gamepad | undefined;

  constructor(
    private scene: GameScene,
    private player: Player,
    private torpedoManager: Torpedo,
    private uiManager: UIManager,
    private sonar: Sonar,
    private gameStateManager: GameStateManager
  ) {}

  setupInput(): void {
    this.scene.input.setPollAlways();
    if (this.scene.input.keyboard) {
      this.cursors = this.scene.input.keyboard.createCursorKeys();
      this.scene.input.keyboard.on("keydown-SPACE", this.triggerSonar, this);
      this.scene.input.keyboard.on("keydown-ESC",() => {
        this.scene.togglePause()
      },  this);
    }

    this.setupGamepadInput();
    this.setupMouseInput();

    this.scene.input.on("wheel", this.handleMouseWheel, this);
  }

  getCursors(): Phaser.Types.Input.Keyboard.CursorKeys {
    return this.cursors;
  }

  private handleMouseWheel(
    pointer: Phaser.Input.Pointer,
    gameObjects: Phaser.GameObjects.GameObject[],
    deltaX: number,
    deltaY: number,
    deltaZ: number,
    gamepad?: boolean
  ): void {
    if (
      this.gameStateManager.isGameOverState() ||
      this.gameStateManager.getAvailableTorpedoTypes().length === 0
    )
      return;

    this.gameStateManager.setScrollAccumulator(
      (this.gameStateManager.getScrollAccumulator() || 0) + deltaY
    );
    const threshold = gamepad ? 0 : 50;

    if (Math.abs(this.gameStateManager.getScrollAccumulator()) >= threshold) {
      if (deltaY > 0) {
        this.gameStateManager.setSelectedTorpedoIndex(
          this.gameStateManager.getSelectedTorpedoIndex() + 1
        );
      } else if (deltaY < 0) {
        this.gameStateManager.setSelectedTorpedoIndex(
          this.gameStateManager.getSelectedTorpedoIndex() - 1
        );
      }

      this.gameStateManager.setSelectedTorpedoIndex(
        ((this.gameStateManager.getSelectedTorpedoIndex() %
          this.gameStateManager.getAvailableTorpedoTypes().length) +
          this.gameStateManager.getAvailableTorpedoTypes().length) %
          this.gameStateManager.getAvailableTorpedoTypes().length
      );

      this.gameStateManager.setSelectedTorpedoType(
        this.gameStateManager.getAvailableTorpedoTypes()[
          this.gameStateManager.getSelectedTorpedoIndex()
        ]
      );

      this.uiManager.updateTorpedoInfo(
        this.torpedoManager.getRemainingTorpedosNumeric(),
        this.gameStateManager.getSelectedTorpedoType()
      );

      this.gameStateManager.setScrollAccumulator(0);
    }
  }

  private setupGamepadInput(): void {
    if (!this.scene.input.gamepad) return;

    const pads = this.scene.input.gamepad.getAll();
    if (pads.length > 0) {
      this.gamepad = pads[0];
    }

    this.scene.input.gamepad.on(
      "connected",
      (pad: Phaser.Input.Gamepad.Gamepad) => {
        this.gamepad = pad;
      },
      this
    );

    this.scene.input.gamepad.on(
      "disconnected",
      (pad: Phaser.Input.Gamepad.Gamepad) => {
        if (this.gamepad === pad) {
          this.gamepad = undefined;
        }
      },
      this
    );

    this.scene.input.gamepad.on(
      Phaser.Input.Gamepad.Events.BUTTON_DOWN,
      (
        pad: Phaser.Input.Gamepad.Gamepad,
        button: Phaser.Input.Gamepad.Button,
        index: number
      ) => {
        if (this.gameStateManager.isGameOverState()) return;

        if (
          button.index === 7 &&
          button.pressed &&
          this.gameStateManager.getAvailableTorpedoTypes().length > 0
        ) {
          const playerSprite = this.player.getSprite();
          const spawnX = playerSprite.x;
          const spawnY = playerSprite.y + (playerSprite.height * 0.1) / 2;
          const { targetX, targetY } = this.getTargetCoordinates();
          const success = this.torpedoManager.fireTorpedo(
            spawnX,
            spawnY,
            targetX,
            targetY,
            this.gameStateManager.getSelectedTorpedoType()
          );
          if (success) {
            this.uiManager.updateTorpedoInfo(
              this.torpedoManager.getRemainingTorpedosNumeric(),
              this.gameStateManager.getSelectedTorpedoType()
            );
          }
        }

        if (button.index === 0 && button.pressed) {
          this.triggerSonar();
        }

        if (button.index === 4 && button.pressed) {
          this.handleMouseWheel(
            this.scene.input.activePointer,
            [],
            0,
            -1,
            0,
            true
          );
        }

        if (button.index === 5 && button.pressed) {
          this.handleMouseWheel(
            this.scene.input.activePointer,
            [],
            0,
            1,
            0,
            true
          );
        }

        if (button.index === 9 && button.pressed) {
          this.scene.togglePause();
        }
      },
      this
    );

    this.scene.game.events.on(
      Phaser.Scenes.Events.UPDATE,
      () => {
        if (!this.gamepad || this.gameStateManager.isGameOverState()) return;

        const rightStickX = this.gamepad.axes[2]?.getValue() || 0;
        const rightStickY = this.gamepad.axes[3]?.getValue() || 0;

        const deadZone = 0.1;
        if (
          Math.abs(rightStickX) < deadZone &&
          Math.abs(rightStickY) < deadZone
        )
          return;

        const sensitivity = 10;
        const currentX =
          this.scene.input.activePointer.worldX ||
          this.scene.cameras.main.centerX;
        const currentY =
          this.scene.input.activePointer.worldY ||
          this.scene.cameras.main.centerY;

        const newX = currentX + rightStickX * sensitivity;
        const newY = currentY + rightStickY * sensitivity;

        this.scene.input.activePointer.worldX = newX;
        this.scene.input.activePointer.worldY = newY;
      },
      this
    );
  }

  private setupMouseInput(): void {
    this.scene.input.on(
      Phaser.Input.Events.POINTER_DOWN,
      (pointer: Phaser.Input.Pointer) => {
        if (
          !this.gameStateManager.isGameOverState() &&
          pointer.leftButtonDown() &&
          this.gameStateManager.getAvailableTorpedoTypes().length > 0
        ) {
          const playerSprite = this.player.getSprite();
          const spawnX = playerSprite.x;
          const spawnY = playerSprite.y + (playerSprite.height * 0.1) / 2;

          const success = this.torpedoManager.fireTorpedo(
            spawnX,
            spawnY,
            pointer.worldX,
            pointer.worldY,
            this.gameStateManager.getSelectedTorpedoType()
          );

          if (success) {
            this.uiManager.updateTorpedoInfo(
              this.torpedoManager.getRemainingTorpedosNumeric(),
              this.gameStateManager.getSelectedTorpedoType()
            );
          }
        }
      },
      this
    );
  }

  private getTargetCoordinates(): { targetX: number; targetY: number } {
    let targetX: number;
    let targetY: number;
    targetX = this.scene.input.activePointer.worldX;
    targetY = this.scene.input.activePointer.worldY;
    if (this.gamepad && this.gamepad.connected) {
      const aimStickX =
        this.gamepad.axes[2]?.getValue() ??
        this.gamepad.axes[0]?.getValue() ??
        0;
      const aimStickY =
        this.gamepad.axes[3]?.getValue() ??
        this.gamepad.axes[1]?.getValue() ??
        0;

      if (Math.abs(aimStickX) > 0.1 || Math.abs(aimStickY) > 0.1) {
        targetX = this.player.getPosition().x + aimStickX * 400;
        targetY = this.player.getPosition().y + aimStickY * 400;
      } else {
        targetX = this.player.getPosition().x;
        targetY = this.player.getPosition().y + 200;
      }
    }
    return { targetX, targetY };
  }

  private triggerSonar(): void {
    if (!this.sonar.isActive()) {
      const playerPos = this.player.getPosition();
      this.sonar.activate(new Phaser.Math.Vector2(playerPos.x, playerPos.y));
    }
  }
}
