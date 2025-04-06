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
import * as C from '../config/constants'

export default class GameScene extends Phaser.Scene {
  private player!: Player;
  private sonar!: Sonar;
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

  constructor() {
    super({ key: "GameScene" });
  }

  create() {
    this.uiManager = new UIManager(this);
    this.gameStateManager = new GameStateManager(this, this.uiManager);

    this.pipelineManager = new PipelineManager(this);
    this.pipelineManager.registerAndConfigureOutlinePipeline();

    this.animationManager = new AnimationManager(this);
    this.animationManager.createAnimations();

    this.sonar = new Sonar(this);
    this.player = new Player(this);
    this.backgroundManager = new BackgroundManager(this);
    this.torpedoManager = new TorpedoManager(this, this.backgroundManager);
    this.bubbleEmitter = new BubbleEmitter(this);

    this.torpedoManager.loadTorpedos([
      TorpedoType.LIGHT,
      TorpedoType.EXPLOSION,
      TorpedoType.SHOCK,
    ]);
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

    this.backgroundManager.create(this.pipelineManager.getOutlinePipeline());
    this.player.create(this.scale.width / 2, this.scale.height * 0.2);
    this.sonar.create(this.pipelineManager.getOutlinePipeline());
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
    if (this.isPaused || this.gameStateManager.isGameOverState()) return;

    const dt = delta / 1000;
    const meters = C.BACKGROUND_SCROLL_SPEED * (delta / 16.66);
    const { targetX, targetY } = this.inputManager.getTargetCoordinates();

    this.gameStateManager.updateDepth(delta);
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

  getIsGameOver() {
    return this.gameStateManager.isGameOverState();
  }

  setGameOver(value: boolean) {
    this.gameStateManager.setGameOver;
  }

  togglePause() {
    this.isPaused = !this.isPaused
    if (this.isPaused) {
      this.jellyfishSpawnManager.pauseSpawnTimer()
    }else {
      this.jellyfishSpawnManager.setupSpawnTimer()
    }
  }
}
