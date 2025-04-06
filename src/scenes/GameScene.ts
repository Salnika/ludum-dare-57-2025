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
  private backgroundSound!: Phaser.Sound.BaseSound;
  private torpedoManager!: Torpedo;
  private depth: number = 0;
  private isGameOver: boolean = false;
  public outlinePipelineInstanceBackground!: outlinePipelineInstanceBackground;
  private jellyfishGroup!: Phaser.Physics.Arcade.Group;
  private jellyfishSpawnTimer!: Phaser.Time.TimerEvent;
  private scrollAccumulator: number = 0;
  private scrollTreshold: number = 10;
  private availableTorpedoTypes: TorpedoType[] = [];
  private selectedTorpedoIndex: number = 0;
  private selectedTorpedoType!: TorpedoType;

  constructor() {
    super({ key: "GameScene" });
  }

  create() {
    this.resetGame();

    this.outlinePipelineInstanceBackground =
      new outlinePipelineInstanceBackground(this.game);
    this.registerAndConfigureoutlinePipelineInstanceBackground();

    if (!this.anims.exists("explosion")) {
      this.anims.create({
        key: "explosion",
        frames: this.anims.generateFrameNumbers(
          C.ASSETS.EXPLOSION_SPRITESHEET,
          { start: 0, end: 8 }
        ),
        frameRate: 10,
        repeat: 0,
      });
    }
    if (!this.anims.exists("shock")) {
      this.anims.create({
        key: "shock",
        frames: this.anims.generateFrameNumbers(C.ASSETS.SHOCK_SPRITESHEET, {
          start: 0,
          end: 8,
        }),
        frameRate: 10,
        repeat: 0,
      });
    }
    if (!this.anims.exists("jellyfish_idle")) {
      this.anims.create({
        key: "jellyfish_idle",
        frames: this.anims.generateFrameNumbers(
          C.ASSETS.JELLYFISH_SPRITESHEET,
          { start: 0, end: 4 }
        ),
        frameRate: 6,
        repeat: -1,
      });
    }
    if (!this.anims.exists("jellyfish_swim")) {
      this.anims.create({
        key: "jellyfish_swim",
        frames: this.anims.generateFrameNumbers(
          C.ASSETS.JELLYFISH_SPRITESHEET,
          { start: 7, end: 11 }
        ),
        frameRate: 6,
        repeat: -1,
      });
    }
    if (!this.anims.exists("jellyfish_swim2")) {
      this.anims.create({
        key: "jellyfish_swim2",
        frames: this.anims.generateFrameNumbers(
          C.ASSETS.JELLYFISH_SPRITESHEET,
          { start: 15, end: 18 }
        ),
        frameRate: 6,
        repeat: -1,
      });
    }
    if (!this.anims.exists("jellyfish_die")) {
      this.anims.create({
        key: "jellyfish_die",
        frames: this.anims.generateFrameNumbers(
          C.ASSETS.JELLYFISH_SPRITESHEET,
          { start: 21, end: 27 }
        ),
        frameRate: 6,
        repeat: 0,
      });
    }

    this.sonar = new Sonar(this);
    this.player = new Player(this);
    this.backgroundManager = new BackgroundManager(this);
    this.torpedoManager = new Torpedo(this, this.backgroundManager);
    this.uiManager = new UIManager(this);
    this.bubbleEmitter = new BubbleEmitter(this);

    this.torpedoManager.loadTorpedos([
      TorpedoType.LIGHT,
      TorpedoType.EXPLOSION,
      TorpedoType.SHOCK,
    ]);
    this.availableTorpedoTypes = this.torpedoManager
      .getRemainingTorpedos()
      .map((torpedo) => torpedo.type);
    if (this.availableTorpedoTypes.length > 0) {
      this.selectedTorpedoType =
        this.availableTorpedoTypes[this.selectedTorpedoIndex];
    } else {
      console.warn("No torpedo types available after loading.");
    }

    this.backgroundManager.create(this.outlinePipelineInstanceBackground);
    this.player.create(this.scale.width / 2, this.scale.height * 0.2);
    this.sonar.create(this.outlinePipelineInstanceBackground);
    this.uiManager.create();
    if (this.availableTorpedoTypes.length > 0) {
      this.uiManager.createTorpedoDisplay(
        this.torpedoManager.getRemainingTorpedosNumeric(),
        this.selectedTorpedoType
      );
    }
    this.bubbleEmitter.create();

    this.setupLighting();
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
    //   this.backgroundSound.play()
  }

  private resetGame(): void {
    this.isGameOver = false;
    this.depth = 0;
    this.selectedTorpedoIndex = 0;
  }

  private setupCollisions(): void {
    /*  const torpedoGroup = this.torpedoManager.getGroup();
    if (torpedoGroup) {
      this.physics.add.overlap(
        torpedoGroup,
        this.jellyfishGroup,
        // @ts-expect-error
        this.handleTorpedoJellyfishCollision,
        undefined,
        this
      );
    } else {
      console.warn("Could not get torpedo group for collision setup.");
    } */
    /*
    this.physics.add.overlap(
      this.player.getSprite(),
      this.jellyfishGroup,
      // @ts-expect-error
      this.handlePlayerJellyfishCollision,
      undefined,
      this
    );
    */
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

  private trySpawnJellyfish(): void {
    if (this.isGameOver) return;

    let spawnChance = 1;
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
      jellyfish.init();
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

    this.coneLight = this.add.pointlight(0, 0, 0xffc000, 300);
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

    this.input.on("wheel", this.handleMouseWheel, this);
  }

  private handleMouseWheel(
    pointer: Phaser.Input.Pointer,
    gameObjects: Phaser.GameObjects.GameObject[],
    deltaX: number,
    deltaY: number,
    deltaZ: number,
    gamepad?: boolean
  ): void {
    if (this.isGameOver || this.availableTorpedoTypes.length === 0) return;

    this.scrollAccumulator = (this.scrollAccumulator || 0) + deltaY;
    const threshold = gamepad ? 0 : 50;

    if (Math.abs(this.scrollAccumulator) >= threshold) {
      if (deltaY > 0) {
        this.selectedTorpedoIndex++;
      } else if (deltaY < 0) {
        this.selectedTorpedoIndex--;
      }

      this.selectedTorpedoIndex =
        ((this.selectedTorpedoIndex % this.availableTorpedoTypes.length) +
          this.availableTorpedoTypes.length) %
        this.availableTorpedoTypes.length;

      this.selectedTorpedoType =
        this.availableTorpedoTypes[this.selectedTorpedoIndex];

      this.uiManager.updateTorpedoInfo(
        this.torpedoManager.getRemainingTorpedosNumeric(),
        this.selectedTorpedoType
      );

      this.scrollAccumulator = 0;
    }
  }

  private setupGamepadInput() {
    if (!this.input.gamepad) return;

    const pads = this.input.gamepad.getAll();
    if (pads.length > 0) {
      this.gamepad = pads[0];
    }

    this.input.gamepad.on(
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
      Phaser.Input.Gamepad.Events.BUTTON_DOWN,
      (
        pad: Phaser.Input.Gamepad.Gamepad,
        button: Phaser.Input.Gamepad.Button,
        index: number
      ) => {
        if (this.isGameOver) return;

        if (
          button.index === 7 &&
          button.pressed &&
          this.availableTorpedoTypes.length > 0
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
            this.selectedTorpedoType
          );
          if (success) {
            this.uiManager.updateTorpedoInfo(
              this.torpedoManager.getRemainingTorpedosNumeric(),
              this.selectedTorpedoType
            );
          }
        }

        if (button.index === 0 && button.pressed) {
          this.triggerSonar();
        }

        if (button.index === 4 && button.pressed) {
          this.handleMouseWheel(this.input.activePointer, [], 0, -1, 0, true);
        }

        if (button.index === 5 && button.pressed) {
          this.handleMouseWheel(this.input.activePointer, [], 0, 1, 0, true);
        }
      },
      this
    );

    this.game.events.on(
      Phaser.Scenes.Events.UPDATE,
      () => {
        if (!this.gamepad || this.isGameOver) return;

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
          this.input.activePointer.worldX || this.cameras.main.centerX;
        const currentY =
          this.input.activePointer.worldY || this.cameras.main.centerY;

        const newX = currentX + rightStickX * sensitivity;
        const newY = currentY + rightStickY * sensitivity;

        this.updateLighting(newX, newY);
        this.input.activePointer.worldX = newX;
        this.input.activePointer.worldY = newY;
      },
      this
    );
  }

  private setupMouseInput() {
    this.input.on(
      Phaser.Input.Events.POINTER_DOWN,
      (pointer: Phaser.Input.Pointer) => {
        if (
          !this.isGameOver &&
          pointer.leftButtonDown() &&
          this.availableTorpedoTypes.length > 0
        ) {
          const playerSprite = this.player.getSprite();
          const spawnX = playerSprite.x;
          const spawnY = playerSprite.y + (playerSprite.height * 0.1) / 2;

          const success = this.torpedoManager.fireTorpedo(
            spawnX,
            spawnY,
            pointer.worldX,
            pointer.worldY,
            this.selectedTorpedoType
          );

          if (success) {
            this.uiManager.updateTorpedoInfo(
              this.torpedoManager.getRemainingTorpedosNumeric(),
              this.selectedTorpedoType
            );
          }
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
      1
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
    this.coneLight.radius = Phaser.Math.Clamp(distanceToTarget * 0.8, 150, 400);
    this.coneLight.intensity = 1.5;
  }

  private triggerSonar() {
    if (!this.sonar.isActive()) {
      const playerPos = this.player.getPosition();
      this.sonar.activate(new Phaser.Math.Vector2(playerPos.x, playerPos.y));
      this.backgroundManager.applySonarEffect();
      this.applySonarEffectToJellyfish();
    }
  }

  private checkPlayerPixelCollision() {
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

  private handlePlayerCollision() {
    if (this.isGameOver) return;

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

    this.jellyfishGroup.children.each(
      (jellyfishGO: Phaser.GameObjects.GameObject) => {
        const jellyfish = jellyfishGO as Jellyfish;
        if (jellyfish.active) {
          this.tweens.add({ targets: jellyfish, alpha: 0, duration: 500 });
          if (jellyfish.body)
            (jellyfish.body as Phaser.Physics.Arcade.Body).stop();
        }
        return true;
      }
    );

    this.time.addEvent({
      delay: 1500,
      callback: () => {
        if (this.physics.world) this.physics.resume();
        this.scene.restart();
      },
      loop: false,
    });
  }

  private applySonarEffectToJellyfish(): void {
    const sonarRadius = this.sonar.getCurrentRadius();
    const sonarPosition = this.sonar.getCurrentPosition();
    const sonarActive = this.sonar.isActive();

    this.jellyfishGroup.children.each(
      (jellyfishGO: Phaser.GameObjects.GameObject) => {
        const jellyfish = jellyfishGO as Jellyfish;
        if (jellyfish.active && !jellyfish.isDying) {
          const distance = Phaser.Math.Distance.Between(
            sonarPosition.x,
            sonarPosition.y,
            jellyfish.x,
            jellyfish.y
          );
          if (sonarActive && distance <= sonarRadius) {
            jellyfish.applySonarEffect();
          } else {
            jellyfish.removeSonarEffect();
          }
        }
        return true;
      }
    );
  }
}
