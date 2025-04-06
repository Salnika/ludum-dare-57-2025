import UIManager from "../ui/UIManager";
import { TorpedoType } from "../components/TorpedoTypes";
import GameScene from "./GameScene";

export default class GameStateManager {
  private depth: number = 0;
  private isGameOver: boolean = false;
  private scrollAccumulator: number = 0;
  private scrollTreshold: number = 10;
  private availableTorpedoTypes: TorpedoType[] = [];
  private selectedTorpedoIndex: number = 0;
  private selectedTorpedoType!: TorpedoType;
  private uiManager: UIManager;
  private scene: GameScene;

  constructor(scene: GameScene, uiManager: UIManager) {
    this.uiManager = uiManager;
    this.scene = scene;
  }

  resetGame(): void {
    this.isGameOver = false;
    this.depth = 0;
    this.selectedTorpedoIndex = 0;
  }

  updateDepth(delta: number): void {
    if (this.scene.isPaused) return;
    this.depth += 0.05 * (delta / 16.66);
    this.uiManager.updateDepthText(this.depth);
    this.uiManager.updateEnergyBar()
  }

  getDepth(): number {
    return this.depth;
  }

  setGameOver(value: boolean): void {
    this.isGameOver = value;
  }

  isGameOverState(): boolean {
    return this.isGameOver;
  }

  setAvailableTorpedoTypes(types: TorpedoType[]): void {
    this.availableTorpedoTypes = types;
  }

  getAvailableTorpedoTypes(): TorpedoType[] {
    return this.availableTorpedoTypes;
  }

  setSelectedTorpedoIndex(index: number): void {
    this.selectedTorpedoIndex = index;
  }

  getSelectedTorpedoIndex(): number {
    return this.selectedTorpedoIndex;
  }

  setSelectedTorpedoType(type: TorpedoType): void {
    this.selectedTorpedoType = type;
  }

  getSelectedTorpedoType(): TorpedoType {
    return this.selectedTorpedoType;
  }

  setScrollAccumulator(value: number): void {
    this.scrollAccumulator = value;
  }

  getScrollAccumulator(): number {
    return this.scrollAccumulator;
  }

  getScrollThreshold(): number {
    return this.scrollTreshold;
  }
}
