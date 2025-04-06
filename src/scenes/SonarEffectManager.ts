import Phaser from "phaser";
import Sonar from "../components/Sonar";
import BackgroundManager from "../components/BackgroundManager";
import Jellyfish from "../components/Jellyfish";

export default class SonarEffectManager {
  constructor(
    private scene: Phaser.Scene,
    private sonar: Sonar,
    private backgroundManager: BackgroundManager,
    private jellyfishGroup: Phaser.Physics.Arcade.Group
  ) {}

  applySonarEffect(): void {
    this.backgroundManager.applySonarEffect();
    this.applySonarEffectToJellyfish();
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
