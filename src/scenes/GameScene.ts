import Phaser from "phaser";
import OutlinePipeline from "../shaders/outline";
import Player from "../components/Player";
import BackgroundManager from "../components/BackgroundManager";
import Sonar from "../components/Sonar";
import UIManager from "../ui/UIManager";
import BubbleEmitter from "../effects/BubbleEmitter";
import Torpedo from "../components/TorpedoManager";
import { TorpedoType } from "../components/TorpedoTypes";
import * as C from "../config/constants";

export default class GameScene extends Phaser.Scene {
  private player!: Player;
  private backgroundManager!: BackgroundManager;
  private sonar!: Sonar;
  private uiManager!: UIManager;
  private bubbleEmitter!: BubbleEmitter;

  private submarineLight!: Phaser.GameObjects.PointLight;
  private coneLight!: Phaser.GameObjects.PointLight;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private gamepad: Phaser.Input.Gamepad.Gamepad | undefined;
  private torpedoManager!: Torpedo;

  private depth: number = 0;
  private isGameOver: boolean = false;

  private outlinePipelineInstance!: OutlinePipeline;

  constructor() {
    super({ key: "GameScene" });
  }

  preload() {
    this.load.spritesheet(C.ASSETS.SUBMARINE_SPRITESHEET, "assets/sub.png", {
      frameWidth: 773,
      frameHeight: 1024,
    });
    this.load.image(C.ASSETS.BACKGROUND_IMAGE, "assets/background.png");

    this.sonar = new Sonar(this);
    this.sonar.preload();
    this.load.image(C.ASSETS.TORPEDO_SPRITE, "assets/torpedo.png");

    this.outlinePipelineInstance = new OutlinePipeline(this.game);
    this.player = new Player(this);
  }

  create() {
    this.isGameOver = false;
    this.depth = 0;

    this.registerAndConfigureOutlinePipeline();
    this.setupLighting();

    this.backgroundManager = new BackgroundManager(this);
    this.backgroundManager.create(this.outlinePipelineInstance);

    this.player.create(this.scale.width / 2, this.scale.height * 0.2);

    this.torpedoManager = new Torpedo(this, 3, this.backgroundManager);

    this.sonar.create(this.outlinePipelineInstance);

    this.uiManager = new UIManager(this);
    this.uiManager.create();

    this.bubbleEmitter = new BubbleEmitter(this);
    this.bubbleEmitter.create();

    this.setupInput();
  }

  update(time: number, delta: number) {
    if (this.isGameOver) return;
    const dt = delta / 1000;

    let targetX: number = this.input.activePointer.worldX;
    let targetY: number = this.input.activePointer.worldY;

    if (this.gamepad) {
      targetX =
        this.player.getPosition().x + this.gamepad.axes[0].getValue() * 200;
      targetY =
        this.player.getPosition().y + this.gamepad.axes[1].getValue() * 200;
    }

    this.updateDepth(delta);
    this.player.updateMovement(this.cursors);
    this.updateLighting(targetX, targetY);
    this.backgroundManager.updateScroll(delta);
    this.sonar.update(dt);

    this.torpedoManager.update(time, delta);

    this.checkPlayerPixelCollision();
  }

  private registerAndConfigureOutlinePipeline() {
    const renderer = this.game.renderer;
    if (renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer) {
      if (!renderer.pipelines.has(OutlinePipeline.KEY)) {
        renderer.pipelines.add(
          OutlinePipeline.KEY,
          this.outlinePipelineInstance
        );
      }
      this.outlinePipelineInstance.setOutlineColor(0x00ff00, 1.0);
      this.outlinePipelineInstance.setThickness(2);
      this.outlinePipelineInstance.setThreshold(0.1);
      this.outlinePipelineInstance.setSonarProperties(0, 0, 0, false);
    } else {
      console.warn(
        "Outline shader requires WebGL renderer. Outline effect disabled."
      );
    }
  }

  private setupLighting() {
    this.lights.enable().setAmbientColor(0x101010);

    this.submarineLight = this.add.pointlight(0, 0, 0x73a9d6, 150);

    this.submarineLight.setDepth(C.DEPTH_LIGHT);
    this.submarineLight.radius = 200;
    this.submarineLight.attenuation = 0.03;

    this.coneLight = this.add.pointlight(0, 0, 0xff0000, 300);
    this.coneLight.radius = 300;
    this.coneLight.attenuation = 0.03;
  }
  private setupInput() {
    this.input.setPollAlways();
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.input.keyboard.on("keydown-SPACE", this.triggerSonar, this);
    }

    if (this.input.gamepad) {
      this.input.gamepad.once(
        "connected",
        (pad: Phaser.Input.Gamepad.Gamepad) => {
          this.gamepad = pad;
        },
        this
      );

      this.input.gamepad.on(
        "disconnected",
        (pad: Phaser.Input.Gamepad.Gamepad) => {
          if (this.gamepad === pad) {
            this.gamepad = undefined;
          }
        },
        this
      );

      this.input.gamepad.on(
        Phaser.Input.Gamepad.Events.GAMEPAD_BUTTON_DOWN,
        (
          pad: Phaser.Input.Gamepad.Gamepad,
          button: Phaser.Input.Gamepad.Button,
          index: number
        ) => {
          if (button.index === 7 && button.pressed) {
            if (!this.isGameOver && this.gamepad) {
              let targetX =
                this.player.getPosition().x +
                this.gamepad.axes[0].getValue() * 200;
              let targetY =
                this.player.getPosition().y +
                this.gamepad.axes[1].getValue() * 200;
              const playerPos = this.player.getPosition();
              this.torpedoManager.fireTorpedo(
                playerPos.x,
                playerPos.y,
                targetX,
                targetY,
                TorpedoType.LIGHT
              );
            }
          }
          if (button.index === 0 && button.pressed) {
            this.triggerSonar();
          }
        },
        this
      );
    }

    this.input.on(
      Phaser.Input.Events.POINTER_DOWN,
      (pointer: Phaser.Input.Pointer) => {
        if (!this.isGameOver && pointer.leftButtonDown()) {
          const playerPos = this.player.getPosition();
          this.torpedoManager.fireTorpedo(
            playerPos.x,
            playerPos.y,
            pointer.worldX,
            pointer.worldY,
            TorpedoType.LIGHT
          );
        }
      },
      this
    );

    this.input.on(
      "pointermove",
      (pointer: Phaser.Input.Pointer) => {
        this.updateLighting(pointer.x + 20, pointer.y + 20);
      },
      this
    );
  }

  private updateDepth(delta: number) {
    this.depth += 0.05 * (delta / 16.66);
    this.uiManager.updateDepthText(this.depth);
  }

  private updateLighting(targetX: number, targetY: number) {
    const ambientLightIntensity = Phaser.Math.Clamp(
      0.5 + (2.0 - this.depth / 10) * 0.5,
      0.05,
      1.0
    );
    const ambientColorValue = Phaser.Display.Color.HSVToRGB(
      0.6,
      0.5,
      ambientLightIntensity
    ).color;
    const ambientColor = Phaser.Display.Color.ValueToColor(ambientColorValue);
    this.lights.setAmbientColor(ambientColor.color);

    this.submarineLight.intensity = Phaser.Math.Clamp(
      0.7 + this.depth / 10,
      0.7,
      2.0
    );

    const playerPos = this.player.getPosition();
    this.submarineLight.setPosition(playerPos.x, playerPos.y);

    const angle = Phaser.Math.Angle.Between(
      playerPos.x,
      playerPos.y,
      targetX,
      targetY
    );

    const coneDistance = 150;
    const coneX = playerPos.x + Math.cos(angle) * coneDistance;
    const coneY = playerPos.y + Math.sin(angle) * coneDistance;

    this.coneLight.setPosition(coneX, coneY);

    const distanceToTarget = Phaser.Math.Distance.Between(
      playerPos.x,
      playerPos.y,
      targetX,
      targetY
    );
    this.coneLight.radius = Math.min(distanceToTarget, 300);
  }

  private triggerSonar() {
    if (!this.sonar.isActive()) {
      this.sonar.activate(this.player.getPosition(), () => {
        this.backgroundManager.applySonarEffect();
      });
      this.backgroundManager.applySonarEffect();
    }
  }

  private checkPlayerPixelCollision() {
    const playerPos = this.player.getPosition();
    const pixel = this.backgroundManager.getTexturePixel(
      playerPos.x,
      playerPos.y
    );

    if (pixel && pixel.alpha > C.COLLISION_PIXEL_THRESHOLD) {
      this.handlePlayerCollision();
    }
  }

  private handlePlayerCollision() {
    if (this.isGameOver || !this.physics.world.enable) return;

    this.isGameOver = true;
    this.physics.pause();
    this.player.handleCollision();
    this.cameras.main.shake(300, 0.01);
    this.bubbleEmitter.stopSpawning();

    this.sonar.deactivate(() => {
      this.backgroundManager.removeSonarEffect();
    });
    this.backgroundManager.removeSonarEffect();

    this.time.addEvent({
      delay: 1500,
      callback: () => {
        this.physics.resume();
        this.scene.restart();
      },
      loop: false,
    });
  }
}
