import Phaser from "phaser";
import Player from "../components/Player";
import BackgroundManager from "../components/BackgroundManager";
import Sonar from "../components/Sonar";
import UIManager from "../ui/UIManager";
import BubbleEmitter from "../effects/BubbleEmitter";
import TorpedoManager from "../components/TorpedoManager";
import { TorpedoType } from "../components/TorpedoTypes";
import GameStateManager from "./GameStateManager";
import AnimationManager from "./AnimationManager";
import CollisionManager from "./CollisionManager";
import LightingManager from "./LightingManager";
import SonarEffectManager from "./SonarEffectManager";
import JellyfishSpawnManager from "./JellyfishSpawnManager";
import PipelineManager from "./PipelineManager";
import Torpedo from "../components/Torpedo";
import InputManager from "./InputManager";
import * as C from "../config/constants";

interface SaveData {
  points: number;
  hull: number;
  slots: number;
  torpedoes: {
    light: boolean;
    shock: boolean;
    explosion: boolean;
  };
}

export default class GameScene extends Phaser.Scene {
  public player!: Player;
  public sonar!: Sonar;
  private backgroundManager!: BackgroundManager;
  private uiManager!: UIManager;
  private bubbleEmitter!: BubbleEmitter;
  private torpedoManager!: TorpedoManager;
  private gameStateManager!: GameStateManager;
  private animationManager!: AnimationManager;
  private collisionManager!: CollisionManager;
  private inputManager!: InputManager;
  private lightingManager!: LightingManager;
  private sonarEffectManager!: SonarEffectManager;
  private jellyfishSpawnManager!: JellyfishSpawnManager;
  private backgroundSound!: Phaser.Sound.BaseSound;
  private pipelineManager!: PipelineManager;
  public isPaused: boolean = false;
  public postSceneLaunched: boolean = false;
  public pauseSceneLaunched: boolean = false;
  private torpedoes: TorpedoType[] = [];

  private powerUpSelectionSceneLaunched: boolean = false;
  private lastPowerUpDepthMilestone: number = 0;
  private readonly POWERUP_DEPTH_INTERVAL: number = 100;

  constructor() {
    super({ key: "GameScene" });
  }

  init(data: { torpedoes: TorpedoType[] }) {
    this.torpedoes = data.torpedoes || [];
    this.isPaused = false;
    this.postSceneLaunched = false;
    this.pauseSceneLaunched = false;
    this.powerUpSelectionSceneLaunched = false;
    this.lastPowerUpDepthMilestone = 0;
    this.backgroundSound = this.sound.add(C.ASSETS.BACKGROUND_SOUND, {
      volume: 0.4,
      loop: true,
    });
  }

  preload(): void {}

  create() {
    this.uiManager = new UIManager(this);
    this.gameStateManager = new GameStateManager(this, this.uiManager);

    this.pipelineManager = new PipelineManager(this);
    this.pipelineManager.registerAndConfigureOutlinePipeline();

    this.animationManager = new AnimationManager(this);
    this.animationManager.createAnimations();

    this.sonar = new Sonar(this, this.pipelineManager);
    this.player = new Player(this);
    this.backgroundManager = new BackgroundManager(this, this.pipelineManager);

    this.torpedoManager = new TorpedoManager(this, this.backgroundManager);
    this.bubbleEmitter = new BubbleEmitter(this);
    this.loadSavedData();
    this.torpedoManager.loadTorpedos(this.torpedoes);

    this.gameStateManager.setAvailableTorpedoTypes(
      this.torpedoManager
        .getRemainingTorpedos()
        .map((torpedo: Torpedo) => torpedo.type)
    );
    if (this.gameStateManager.getAvailableTorpedoTypes().length > 0) {
      this.gameStateManager.setSelectedTorpedoType(
        this.gameStateManager.getAvailableTorpedoTypes()[
          this.gameStateManager.getSelectedTorpedoIndex()
        ]
      );
    } else {
    }

    this.backgroundManager.create();
    this.player.create(this.scale.width / 2, this.scale.height * 0.2);
    this.sonar.create();
    this.uiManager.create();
    if (this.gameStateManager.getAvailableTorpedoTypes().length > 0) {
      this.uiManager.createTorpedoDisplay(
        this.torpedoManager.getRemainingTorpedosNumeric(),
        this.gameStateManager.getSelectedTorpedoType()
      );
    }

    this.bubbleEmitter.create();

    this.lightingManager = new LightingManager(this, this.player);
    this.lightingManager.setupLighting();

    this.jellyfishSpawnManager = new JellyfishSpawnManager(
      this,
      this.gameStateManager.getDepth()
    );
    this.jellyfishSpawnManager.setupSpawnTimer();

    this.sonarEffectManager = new SonarEffectManager(
      this,
      this.sonar,
      this.backgroundManager,
      this.jellyfishSpawnManager.getJellyfishGroup()
    );

    this.collisionManager = new CollisionManager(
      this,
      this.player,
      this.torpedoManager,
      this.jellyfishSpawnManager.getJellyfishGroup(),
      this.backgroundManager,
      this.sonar,
      this.bubbleEmitter,
      this.jellyfishSpawnManager.getJellyfishSpawnTimer()
    );
    this.collisionManager.setupCollisions();

    this.inputManager = new InputManager(
      this,
      this.player,
      this.torpedoManager,
      this.uiManager,
      this.sonar,
      this.gameStateManager
    );
    this.inputManager.setupInput();

    this.triggerPowerUpSelection();
    this.backgroundSound.play()
  }

  update(time: number, delta: number) {
    if (this.gameStateManager.isGameOverState() && !this.postSceneLaunched) {
      this.postSceneLaunched = true;
      const finalDepth = this.gameStateManager.getDepth();
      this.scene.start("PostScene", {
        points: Math.round(finalDepth),
      });
      return;
    }

    if (
      this.isPaused ||
      this.gameStateManager.isGameOverState() ||
      this.powerUpSelectionSceneLaunched
    ) {
      return;
    }

    const dt = delta / 1000;
    //@ts-expect-error - Assuming getTargetCoordinates exists
    const { targetX, targetY } = this.inputManager.getTargetCoordinates();

    this.gameStateManager.updateDepth(delta);
    if (this.sonar.energy < 100) {
      this.sonar.energy += 0.25 * dt;
    }
    this.player.updateMovement(this.inputManager.getCursors());
    this.lightingManager.updateLighting(
      targetX,
      targetY,
      this.gameStateManager.getDepth()
    );
    this.backgroundManager.updateScroll(delta);
    this.sonar.update(dt);
    this.torpedoManager.update(time, delta);

    this.collisionManager.checkPlayerPixelCollision();
    if (this.sonar.isActive()) {
      this.sonarEffectManager.applySonarEffect();
    }

    const currentDepth = this.gameStateManager.getDepth();
    if (
      !this.powerUpSelectionSceneLaunched &&
      currentDepth >=
        this.lastPowerUpDepthMilestone + this.POWERUP_DEPTH_INTERVAL
    ) {
      this.lastPowerUpDepthMilestone += this.POWERUP_DEPTH_INTERVAL;
      this.triggerPowerUpSelection();
    }
  }

  private triggerPowerUpSelection() {
    if (
      this.powerUpSelectionSceneLaunched ||
      this.gameStateManager.isGameOverState() ||
      this.pauseSceneLaunched
    ) {
      return;
    }

    this.powerUpSelectionSceneLaunched = true;
    this.isPaused = true;

    if (
      this.jellyfishSpawnManager &&
      typeof this.jellyfishSpawnManager.pauseSpawnTimer === "function"
    ) {
      this.jellyfishSpawnManager.pauseSpawnTimer();
    } else {
    }

    this.scene.launch("PowerUpSelectionScene", {
      callerSceneKey: this.scene.key,
    });
  }

  resume(system: Phaser.Scenes.Systems, data?: string) {
    if (data) {
      this.powerUpSelectionSceneLaunched = false;
      this.isPaused = false;

      if (
        this.jellyfishSpawnManager &&
        typeof this.jellyfishSpawnManager.setupSpawnTimer === "function"
      ) {
        this.jellyfishSpawnManager.setupSpawnTimer();
      } else {
      }

      this.applyPowerUpEffect(data);
    } else if (this.pauseSceneLaunched) {
      this.resumeGame();
    } else if (
      !this.powerUpSelectionSceneLaunched &&
      !this.pauseSceneLaunched
    ) {
      this.isPaused = false;
      if (!this.gameStateManager.isGameOverState()) {
        this.physics.resume();
        if (
          this.jellyfishSpawnManager &&
          !this.jellyfishSpawnManager.getJellyfishSpawnTimer().paused
        ) {
        }
      }
    }
  }

  private applyPowerUpEffect(powerUpKey: string) {
    switch (powerUpKey) {
      case "sonar_boost":
        this.sonar.maxSonarRadius += 50;
        break;
      case "silent_sonar":
        this.sonar.setSilent();
        break;
      case "hull_reinforce":
        this.player.setHull(this.player.hullLife + 1);
        break;
      case "propulsion_boost":
        this.player.speedBonus += 10;
        break;
      case "sonar_recharge":
        this.sonar.sonarRechageBonus += 0.25;
        break;
      case "extra_torpedo":
        const values = Object.values(TorpedoType);
        const randomIndex = Math.floor(Math.random() * values.length);
        this.torpedoManager.loadTorpedos([values[randomIndex]]);
        break;
      case "temp_shield":
        this.player.triggerInvincible();
        break;
      default:
        return;
    }
  }

  private loadSavedData(): void {
    try {
      const savedDataString =
        localStorage.getItem("save") ||
        '{"points":0,"hull":1,"slots":3,"torpedoes":{"light":true,"shock":false,"explosion":false}}';
      const savedData: SaveData = JSON.parse(savedDataString);

      if (this.player) {
        this.player.setHull(savedData.hull || 1);
      } else {
      }

      const unlockedTorpedoTypes: TorpedoType[] = [];
      if (savedData.torpedoes) {
        if (savedData.torpedoes.light) {
          unlockedTorpedoTypes.push(TorpedoType.LIGHT);
        }
        if (savedData.torpedoes.shock) {
          unlockedTorpedoTypes.push(TorpedoType.SHOCK);
        }
        if (savedData.torpedoes.explosion) {
          unlockedTorpedoTypes.push(TorpedoType.EXPLOSION);
        }
      } else {
      }
    } catch (error) {
      if (this.player) this.player.setHull(1);
    }
  }

  getIsGameOver() {
    return this.gameStateManager.isGameOverState();
  }

  setGameOver(value: boolean) {
    this.gameStateManager.setGameOver(value);
  }

  restart() {
    window.location.reload();
  }

  togglePause() {
    if (this.powerUpSelectionSceneLaunched) {
      return;
    }

    if (this.isPaused) {
      this.resumeGame();
    } else {
      this.pauseGame();
    }
  }

  private pauseGame() {
    if (
      this.isPaused ||
      this.powerUpSelectionSceneLaunched ||
      this.gameStateManager.isGameOverState()
    )
      return;

    this.isPaused = true;
    this.pauseSceneLaunched = true;

    this.jellyfishSpawnManager.pauseSpawnTimer();

    this.scene.launch("PauseScene");
  }

  private resumeGame() {
    if (!this.isPaused || !this.pauseSceneLaunched) return;

    this.isPaused = false;
    this.pauseSceneLaunched = false;

    this.scene.stop("PauseScene");

    this.jellyfishSpawnManager.setupSpawnTimer();
  }

  shutdown() {
    if (this.pipelineManager) {
      this.pipelineManager.destroy();
    }
    if (this.scene.isActive("PowerUpSelectionScene"))
      this.scene.stop("PowerUpSelectionScene");
    if (this.scene.isActive("PauseScene")) this.scene.stop("PauseScene");
  }

  destroy() {}
}
