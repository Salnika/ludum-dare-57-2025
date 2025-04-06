import Phaser from "phaser";
import { TorpedoType } from "./TorpedoTypes";
import SingleTorpedo from "./Torpedo";
import BackgroundManager from "./BackgroundManager";
import GameScene from "../scenes/GameScene";

export default class Torpedo {
  private torpedoGroup: Phaser.Physics.Arcade.Group;
  private scene: GameScene;
  private backgroundManager: BackgroundManager;

  constructor(scene: GameScene, backgroundManager: BackgroundManager) {
    this.scene = scene;
    this.backgroundManager = backgroundManager;
    this.torpedoGroup = this.scene.physics.add.group({
      runChildUpdate: true,
    });
  }

  loadTorpedos(types: TorpedoType[]): void {
    for (const type of types) {
      const torpedo = new SingleTorpedo(
        this.scene,
        type,
        this.backgroundManager
      );
      torpedo.resetState();
      this.torpedoGroup.add(torpedo.sprite);
    }
  }

  removeTorpedoFromPool(torpedoToRemove: SingleTorpedo) {
    this.torpedoGroup.remove(torpedoToRemove.sprite, true, true);
  }

  getTorpedo(type: TorpedoType): SingleTorpedo | null {
    let foundTorpedo: SingleTorpedo | null = null;
    //@ts-expect-error
    this.torpedoGroup.children.each((child: Phaser.GameObjects.GameObject) => {
      const torpedo = child.data.get("torpedoInstance") as SingleTorpedo;
      if (
        torpedo.type === type &&
        !torpedo.isActive() &&
        !torpedo.hasActiveLightEffect() &&
        !torpedo.hasBeenFired
      ) {
        foundTorpedo = torpedo;
        return false;
      }
    }, this);
    return foundTorpedo;
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
    //@ts-expect-error
    this.torpedoGroup.children.each((child: Phaser.GameObjects.GameObject) => {
      const torpedo = child.data.get("torpedoInstance") as SingleTorpedo;
      if (
        torpedo.isActive() ||
        torpedo.hasActiveLightEffect() ||
        !torpedo.hasExploded
      ) {
        torpedo.update(time, delta);
      } else if (torpedo.hasExploded) {
        this.removeTorpedoFromPool(torpedo);
      }
    }, this);
  }

  getActiveTorpedoSprites(): Phaser.Physics.Arcade.Sprite[] {
    const activeSprites: Phaser.Physics.Arcade.Sprite[] = [];
    //@ts-expect-error
    this.torpedoGroup.children.each((child: Phaser.GameObjects.GameObject) => {
      const torpedo = child.data.get("torpedoInstance") as SingleTorpedo;
      if (torpedo.isActive()) {
        activeSprites.push(child as Phaser.Physics.Arcade.Sprite);
      }
    }, this);
    return activeSprites;
  }

  getRemainingTorpedos(): SingleTorpedo[] {
    const remainingTorpedos: SingleTorpedo[] = [];
    //@ts-expect-error
    this.torpedoGroup.children.each((child: Phaser.GameObjects.GameObject) => {
      const torpedo = child?.data?.get("torpedoInstance") as SingleTorpedo;
      remainingTorpedos.push(torpedo);
    }, this);
    return remainingTorpedos;
  }

  getRemainingTorpedosNumeric(): Map<TorpedoType, number> {
    const torpedoCount = new Map<TorpedoType, number>();
    //@ts-expect-error
    this.torpedoGroup.children.each((child: Phaser.GameObjects.GameObject) => {
      const torpedo = child.data.get("torpedoInstance") as SingleTorpedo;
      if (!torpedo.hasBeenFired) {
        const currentCount = torpedoCount.get(torpedo.type) || 0;
        torpedoCount.set(torpedo.type, currentCount + 1);
      }
    }, this);
    return torpedoCount;
  }

  getGroup() {
    return this.torpedoGroup;
  }
}
