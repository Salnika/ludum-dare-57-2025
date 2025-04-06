import Phaser from "phaser";
import { TorpedoType } from "./TorpedoTypes";
import SingleTorpedo from "./Torpedo";
import BackgroundManager from "./BackgroundManager";

export default class Torpedo {
  private torpedoPool: SingleTorpedo[] = [];
  private scene: Phaser.Scene;
  private backgroundManager: BackgroundManager;

  constructor(scene: Phaser.Scene, backgroundManager: BackgroundManager) {
    this.scene = scene;
    this.torpedoPool = [];
    this.backgroundManager = backgroundManager;
  }

  loadTorpedos(types: TorpedoType[]): void {
    this.torpedoPool.forEach((torpedo) => {
      if (torpedo.sprite) {
        torpedo.sprite.destroy();
      }
    });

    for (const type of types) {
      const torpedo = new SingleTorpedo(
        this.scene,
        type,
        this.backgroundManager
      );
      torpedo.resetState();
      this.torpedoPool.push(torpedo);
    }
  }

  removeTorpedoFromPool(torpedoToRemove: SingleTorpedo) {
    this.torpedoPool = this.torpedoPool.filter(
      (torped) => torped.id !== torpedoToRemove.id
    );
  }

  getTorpedo(type: TorpedoType): SingleTorpedo | null {
    const inactiveTorpedo = this.torpedoPool.find(
      (torpedo) =>
        torpedo.type === type &&
        !torpedo.isActive() &&
        !torpedo.hasActiveLightEffect() &&
        !torpedo.hasBeenFired
    );
    return inactiveTorpedo || null;
  }

  fireTorpedo(
    startX: number,
    startY: number,
    targetX: number,
    targetY: number,
    type: TorpedoType
  ): boolean {
    const torpedo = this.getTorpedo(type);

    if (torpedo) {
      torpedo.fireTorpedo(startX, startY, targetX, targetY, type);
      return true;
    } else {
      return false;
    }
  }

  update(time: number, delta: number): void {
    this.torpedoPool.forEach((torpedo) => {
      if (torpedo.isActive() || torpedo.hasActiveLightEffect()) {
        torpedo.update(time, delta);
      }
      if (
        !torpedo.isActive() &&
        !torpedo.hasActiveLightEffect() &&
        torpedo.hasBeenFired
      ) {
        this.removeTorpedoFromPool(torpedo);
      }
    });
  }

  getActiveTorpedoSprites(): Phaser.Physics.Arcade.Sprite[] {
    return this.torpedoPool
      .filter((torpedo) => torpedo.isActive())
      .map((torpedo) => torpedo.sprite)
      .filter((sprite) => sprite !== undefined && sprite !== null);
  }

  getRemainingTorpedos(): typeof this.torpedoPool {
    return this.torpedoPool;
  }

  getRemainingTorpedosNumeric(): Map<TorpedoType, number> {
    const torpedoCount = new Map<TorpedoType, number>();

    for (const torpedo of this.torpedoPool) {
      if (!torpedo.hasBeenFired) {
        const currentCount = torpedoCount.get(torpedo.type) || 0;
        torpedoCount.set(torpedo.type, currentCount + 1);
      }
    }

    return torpedoCount;
  }
}
