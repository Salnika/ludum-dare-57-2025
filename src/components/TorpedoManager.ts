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
    console.log(type);
    const torpedo = this.getTorpedo(type);

    if (torpedo) {
      torpedo.fireTorpedo(startX, startY, targetX, targetY, type);
      return true;
    } else {
      console.log(
        `No inactive torpedoes of type ${TorpedoType[type]} available in the pool.`
      );
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

  getRemainingTorpedos(): { [key: string]: number } {
    const remaining: { [key: string]: number } = {};
    this.torpedoPool.forEach((torpedo) => {
      console.log("ici", torpedo);
      if (!torpedo.isActive() && !torpedo.hasActiveLightEffect()) {
        const typeName = TorpedoType[torpedo.type];
        remaining[typeName] = (remaining[typeName] || 0) + 1;
      }
    });
    return remaining;
  }

  getRemainingTorpedosNumeric(): { [key in TorpedoType]?: number } {
    const remaining: { [key in TorpedoType]?: number } = {};
    this.torpedoPool.forEach((torpedo) => {
      console.log("ici", torpedo);
      if (!torpedo.isActive() && !torpedo.hasActiveLightEffect()) {
        const typeValue = torpedo.type;
        remaining[typeValue] = (remaining[typeValue] || 0) + 1;
      }
    });
    return remaining;
  }
}
