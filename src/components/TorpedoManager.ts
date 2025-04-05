import Phaser from "phaser";
import BackgroundManager from "./BackgroundManager";
import { TorpedoType } from "./TorpedoTypes";
import SingleTorpedo from "./Torpedo";

export default class Torpedo {
  private torpedoPool: SingleTorpedo[] = [];
  private torpedoPoolSize: number = 3;

  constructor(
    scene: Phaser.Scene,
    torpedoPoolSize: number,
    backgroundManager: BackgroundManager
  ) {
    this.torpedoPoolSize = torpedoPoolSize || 3;

    for (let i = 0; i < this.torpedoPoolSize; i++) {
      const torpedo = new SingleTorpedo(scene, backgroundManager);
      this.torpedoPool.push(torpedo);
    }
  }

  getTorpedo(): SingleTorpedo | null {
    const inactiveTorpedo = this.torpedoPool.find(
      (torpedo) => !torpedo.isActive() && !torpedo.hasActiveLight() // Vérification de la lumière
    );
    return inactiveTorpedo || null;
  }

  fireTorpedo(
    startX: number,
    startY: number,
    targetX: number,
    targetY: number,
    type: TorpedoType
  ) {
    const torpedo = this.getTorpedo();

    if (torpedo) {
      torpedo.fireTorpedo(startX, startY, targetX, targetY, type);
    } else {
      console.log("No inactive torpedoes available in the pool.");
    }
  }

  update(time: number, delta: number) {
    this.torpedoPool.forEach((torpedo) => torpedo.update(time, delta));
  }
}

