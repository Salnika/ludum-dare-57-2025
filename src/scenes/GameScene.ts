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
    stun: boolean;
    blast: boolean;
  };
}

export default class GameScene extends Phaser.Scene {
  private player!: Player;
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
  private pipelineManager!: PipelineManager;
  public isPaused: boolean = false;
  public postSceneLaunched: boolean = false;
  public pauseSceneLaunched: boolean = false;
  private torpedoes: TorpedoType[] = [];

  constructor() {
    super({ key: "GameScene" });
  }

  init(data: { torpedoes: TorpedoType[] }) {
    this.torpedoes = data.torpedoes || [];
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

    this.animationManager = new AnimationManager(this);
    this.animationManager.createAnimations();

    this.player = new Player(this);
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
      console.warn("No torpedo types available after loading.");
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
  }

  update(time: number, delta: number) {
    if (this.gameStateManager.isGameOverState() && !this.postSceneLaunched) {
      this.postSceneLaunched = true;
      this.scene.start("PostScene", {
        points: this.gameStateManager.getDepth().toFixed(0),
      });
      return;
    }

    if (this.isPaused || this.gameStateManager.isGameOverState()) return;

    const dt = delta / 1000;
      //@ts-expect-error
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
  }

  private loadSavedData(): void {
    try {
      const savedDataString =
        localStorage.getItem("save") ||
        '{"points":0,"hull":1,"slots":3,"torpedoes":{"light":true,"stun":false,"blast":false}}';
      const savedData: SaveData = JSON.parse(savedDataString);

      this.player.setHull(savedData.hull || 1);
      if (savedData.torpedoes) {
        const availableTorpedoTypes: TorpedoType[] = [];
        if (savedData.torpedoes.light) {
          availableTorpedoTypes.push(TorpedoType.LIGHT);
        }
        if (savedData.torpedoes.stun) {
          availableTorpedoTypes.push(TorpedoType.SHOCK);
        }
        if (savedData.torpedoes.blast) {
          availableTorpedoTypes.push(TorpedoType.EXPLOSION);
        }

        this.gameStateManager.setAvailableTorpedoTypes(availableTorpedoTypes);

        if (availableTorpedoTypes.length > 0) {
          this.gameStateManager.setSelectedTorpedoType(
            availableTorpedoTypes[0]
          );
        } else {
          this.gameStateManager.setSelectedTorpedoType(TorpedoType.LIGHT);
          console.warn("No saved torpedos available");
        }
      }

    } catch (error) {
      console.error("Failed to load save data:", error);
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
    if (this.isPaused) {
      this.resumeGame();
      return;
    }
    this.pauseGame();
  }

  private pauseGame() {
    if (this.pauseSceneLaunched) return;
    this.pauseSceneLaunched = true;
    this.isPaused = true;
    this.jellyfishSpawnManager.pauseSpawnTimer();
    this.scene.launch("PauseScene");
    this.scene.pause();
  }

  private resumeGame() {
    this.isPaused = false;
    this.pauseSceneLaunched = false;
    this.jellyfishSpawnManager.setupSpawnTimer();
    this.scene.resume();
    this.scene.stop("PauseScene");
  }

  shutdown() {
    this.pipelineManager.destroy();
  }

  destroy() {
    this.pipelineManager.destroy();
  }
}
