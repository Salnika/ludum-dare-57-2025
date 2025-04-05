import Phaser from "phaser";
import outlinePipelineInstanceBackground from "../shaders/outline";
import Player from "../components/Player";
import BackgroundManager from "../components/BackgroundManager";
import Sonar from "../components/Sonar";
import UIManager from "../ui/UIManager";
import BubbleEmitter from "../effects/BubbleEmitter";
import Torpedo from "../components/TorpedoManager";
import { TorpedoType } from "../components/TorpedoTypes";
import * as C from "../config/constants";
import Jellyfish from "../components/Jellyfish";

export default class GameScene extends Phaser.Scene {
  public player!: Player;
  public sonar!: Sonar;
  private backgroundManager!: BackgroundManager;
  private uiManager!: UIManager;
  private bubbleEmitter!: BubbleEmitter;
  private submarineLight!: Phaser.GameObjects.PointLight;
  private coneLight!: Phaser.GameObjects.PointLight;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private gamepad: Phaser.Input.Gamepad.Gamepad | undefined;
  private torpedoManager!: Torpedo;
  private depth: number = 0;
  private isGameOver: boolean = false;
  public outlinePipelineInstanceBackground!: outlinePipelineInstanceBackground;
  private jellyfishGroup!: Phaser.Physics.Arcade.Group;
  private jellyfishSpawnTimer!: Phaser.Time.TimerEvent;

  constructor() {
    super({ key: "GameScene" });
  }

  preload() {
    this.load.spritesheet(C.ASSETS.SUBMARINE_SPRITESHEET, "assets/sub.png", {
      frameWidth: 773,
      frameHeight: 1024,
    });
    this.load.image(C.ASSETS.BACKGROUND_IMAGE, "assets/background.png");
    this.load.audio(C.ASSETS.TORPEDO_SOUND, "assets/torpedo.mp3")
    this.load.spritesheet(
      C.ASSETS.JELLYFISH_SPRITESHEET,
      "assets/jellyfish-upscale.png",
      {
        frameWidth: 128,
        frameHeight: 128,
      }
    );
    this.sonar = new Sonar(this);
    this.sonar.preload();
    this.load.image(C.ASSETS.TORPEDO_SPRITE, "assets/torpedo.png");
    this.outlinePipelineInstanceBackground =
      new outlinePipelineInstanceBackground(this.game);
    this.player = new Player(this);
  }

  create() {
    this.resetGame();
    this.registerAndConfigureoutlinePipelineInstanceBackground();
    this.setupLighting();
    this.backgroundManager = new BackgroundManager(this);
    this.backgroundManager.create(this.outlinePipelineInstanceBackground);
    this.player.create(this.scale.width / 2, this.scale.height * 0.2);
    this.torpedoManager = new Torpedo(this, 3, this.backgroundManager);
    this.sonar.create(this.outlinePipelineInstanceBackground);
    this.uiManager = new UIManager(this);
    this.uiManager.create();
    this.bubbleEmitter = new BubbleEmitter(this);
    this.bubbleEmitter.create();

    this.jellyfishGroup = this.physics.add.group({
      classType: Jellyfish,
      runChildUpdate: true,
    });
    this.jellyfishSpawnTimer = this.time.addEvent({
      delay: 2000,
      callback: this.trySpawnJellyfish,
      callbackScope: this,
      loop: true,
    });
    this.setupInput();
    this.setupCollisions();
  }

  private resetGame(): void {
    this.isGameOver = false;
    this.depth = 0;
  }

  private setupCollisions(): void {
    /* this.physics.add.overlap(
      this.player.getSprite(),
      this.jellyfishGroup,
      // @ts-expect-error
      this.handlePlayerJellyfishCollision,
      undefined,
      this
    ); */
  }

  private handlePlayerJellyfishCollision(
    playerSprite: Phaser.GameObjects.GameObject,
    jellyfishGameObject: Phaser.GameObjects.GameObject
  ): void {
    const jellyfish = jellyfishGameObject as Jellyfish;
    if (this.isGameOver || jellyfish.isDying) {
      return;
    }
    jellyfish.die();
    this.handlePlayerCollision();
  }

  private handleTorpedoJellyfishCollision(
    torpedoGameObject: Phaser.GameObjects.GameObject,
    jellyfishGameObject: Phaser.GameObjects.GameObject
  ): void {
    const jellyfish = jellyfishGameObject as Jellyfish;
    const torpedo = torpedoGameObject as Phaser.Physics.Arcade.Sprite;

    if (!jellyfish.active || jellyfish.isDying || !torpedo.active) {
      return;
    }
    jellyfish.die();
    torpedo.destroy();
  }

  private trySpawnJellyfish(): void {
    if (this.isGameOver) return;

    let spawnChance = 10;
    if (this.depth > 100) {
      spawnChance += Math.floor((this.depth - 100) / 5) * 0.02;
    }
    spawnChance = Math.min(1.0, spawnChance);

    if (Math.random() < spawnChance) {
      this.spawnJellyfish();
    }
  }

  private spawnJellyfish(): void {
    const spawnSide = Math.random() * (this.scale.width - 300) + 150;
    const spawnY = this.cameras.main.worldView.bottom + 50;

    const jellyfish = this.jellyfishGroup.get(spawnSide, spawnY) as Jellyfish;
    if (jellyfish) {
      jellyfish.setActive(true);
      jellyfish.setVisible(true);
    }
  }

  update(time: number, delta: number) {
    if (this.isGameOver) return;

    const dt = delta / 1000;
    const { targetX, targetY } = this.getTargetCoordinates();

    this.updateDepth(delta);
    this.player.updateMovement(this.cursors);
    this.updateLighting(targetX, targetY);
    this.backgroundManager.updateScroll(delta);
    this.sonar.update(dt);
    this.torpedoManager.update(time, delta);

    this.checkPlayerPixelCollision();
    if (this.sonar.isActive()) {
      this.applySonarEffectToJellyfish();
    }
  }

  private getTargetCoordinates(): { targetX: number; targetY: number } {
    let targetX: number;
    let targetY: number;
    targetX = this.input.activePointer.worldX;
      targetY = this.input.activePointer.worldY;
    if (this.gamepad) {
      targetX =
        this.player.getPosition().x + this.gamepad.axes[0].getValue() * 400;
      targetY =
        this.player.getPosition().y + this.gamepad.axes[1].getValue() * 400;      
    }
    return { targetX, targetY };
  }

  private registerAndConfigureoutlinePipelineInstanceBackground() {
    const renderer = this.game.renderer;
    if (renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer) {
      if (!renderer.pipelines.has(outlinePipelineInstanceBackground.KEY)) {
        renderer.pipelines.add(
          outlinePipelineInstanceBackground.KEY,
          this.outlinePipelineInstanceBackground
        );
      }
      this.outlinePipelineInstanceBackground.setOutlineColor(0x00ff00, 1.0);
      this.outlinePipelineInstanceBackground.setThickness(2);
      this.outlinePipelineInstanceBackground.setThreshold(0.1);
      this.outlinePipelineInstanceBackground.setSonarProperties(0, 0, 0, false);
    }
  }

  private setupLighting() {
    this.lights.enable().setAmbientColor(0x101010);

    this.submarineLight = this.add.pointlight(0, 0, 0x73a9d6, 150);
    this.submarineLight.setDepth(C.DEPTH_LIGHT);
    this.submarineLight.radius = 200;
    this.submarineLight.attenuation = 0.03;

    this.coneLight = this.add.pointlight(0, 0, 0xFFC000, 300);
    this.coneLight.radius = 300;
    this.coneLight.attenuation = 0.03;
  }

  private setupInput() {
    this.input.setPollAlways();
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.input.keyboard.on("keydown-SPACE", this.triggerSonar, this);
    }

    this.setupGamepadInput();
    this.setupMouseInput();
  }

  private setupGamepadInput() {
    if (!this.input.gamepad) return;

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

  private setupMouseInput() {
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
        this.updateLighting(pointer.worldX, pointer.worldY);
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
      const playerPos = this.player.getPosition();
      const screenX = playerPos.x;
      const screenY = playerPos.y;
      this.sonar.activate(new Phaser.Math.Vector2(screenX, screenY));
      this.sonarActivationTimestamp = Date.now();
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

    if (this.jellyfishSpawnTimer) this.jellyfishSpawnTimer.paused = true;

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

  private applySonarEffectToJellyfish(): void {
    const sonarRadius = this.sonar.getCurrentRadius();
    const sonarPosition = this.sonar.getCurrentPosition();

    this.jellyfishGroup.children.each(
      (jellyfishGO: Phaser.GameObjects.GameObject) => {
        const jellyfish = jellyfishGO as Jellyfish;
        if (jellyfish.active && !jellyfish.isDying) {
          const jellyfishScreenX = jellyfish.x;
          const jellyfishScreenY = jellyfish.y;

          const distance = Phaser.Math.Distance.Between(
            sonarPosition.x,
            sonarPosition.y,
            jellyfishScreenX,
            jellyfishScreenY
          );

          if (distance <= sonarRadius) {
            jellyfish.applySonarEffect();
          }
        }
        return true;
      }
    );
  }
}
