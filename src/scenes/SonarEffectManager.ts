import Phaser from "phaser";
import Sonar from "../components/Sonar";
import BackgroundManager from "../components/BackgroundManager";
import Jellyfish from "../components/Jellyfish";
import GameScene from "./GameScene";

export default class SonarEffectManager {
  constructor(
    private scene: GameScene,
    private sonar: Sonar,
    private backgroundManager: BackgroundManager,
    private jellyfishGroup: Phaser.Physics.Arcade.Group
  ) {}

  applySonarEffect(): void {
    if (this.scene.isPaused) return;
    this.backgroundManager.applySonarEffect();
    this.applySonarEffectToJellyfish();
  }

  private applySonarEffectToJellyfish(): void {
    if (this.scene.isPaused) return;
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
