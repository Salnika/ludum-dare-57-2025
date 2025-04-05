import Phaser from "phaser";
import OutlinePipeline from "../shaders/outline";
import Player from "../components/Player";
import BackgroundManager from "../components/BackgroundManager";
import Sonar from "../components/Sonar";
import UIManager from "../ui/UIManager";
import BubbleEmitter from "../effects/BubbleEmitter";
import * as C from "../config/constants";

export default class GameScene extends Phaser.Scene {
  private player!: Player;
  private backgroundManager!: BackgroundManager;
  private sonar!: Sonar;
  private uiManager!: UIManager;
  private bubbleEmitter!: BubbleEmitter;

  private submarineLight!: Phaser.GameObjects.PointLight;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

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

    this.outlinePipelineInstance = new OutlinePipeline(this.game);
  }

  create() {
    this.isGameOver = false;
    this.depth = 0;

    this.registerAndConfigureOutlinePipeline();
    this.setupLighting();

    this.backgroundManager = new BackgroundManager(this);
    this.backgroundManager.create(this.outlinePipelineInstance);

    this.player = new Player(this);
    this.player.create(this.scale.width / 2, this.scale.height * 0.2);

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

    this.updateDepth(delta);
    this.player.updateMovement(this.cursors);
    this.updateLighting();
    this.backgroundManager.updateScroll(delta);
    this.sonar.update(dt, this.player.getPosition());

    this.checkPixelCollision();
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

    this.submarineLight = this.add
      .pointlight(0, 0, 0x73a9d6, 150, 1.0, 0.05)
      .setDepth(C.DEPTH_LIGHT);
    this.submarineLight.radius = 200;
    this.submarineLight.attenuation = 0.03;
  }

  private setupInput() {
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.input.keyboard.on("keydown-SPACE", this.triggerSonar, this);
    }
  }

  private updateDepth(delta: number) {
    this.depth += 0.05 * (delta / 16.66);
    this.uiManager.updateDepthText(this.depth);
  }

  private updateLighting() {
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
  }

  private triggerSonar() {
    if (!this.sonar.isActive()) {
      this.sonar.activate(this.player.getPosition(), () => {
        this.backgroundManager.applySonarEffect();
      });
      this.backgroundManager.applySonarEffect();
    }
  }

  private checkPixelCollision() {
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
    if (this.isGameOver || !this.physics.world.enabled) return;

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
