import Phaser from "phaser";
import Jellyfish from "../components/Jellyfish";

export default class JellyfishSpawnManager {
  private jellyfishGroup!: Phaser.Physics.Arcade.Group;
  private jellyfishSpawnTimer!: Phaser.Time.TimerEvent;

  constructor(private scene: Phaser.Scene, private depth: number) {
    this.jellyfishGroup = this.scene.physics.add.group({
      classType: Jellyfish,
      runChildUpdate: true,
    });
  }

  getJellyfishGroup(): Phaser.Physics.Arcade.Group {
    return this.jellyfishGroup;
  }

  getJellyfishSpawnTimer(): Phaser.Time.TimerEvent {
    return this.jellyfishSpawnTimer;
  }

  setupSpawnTimer(): void {
    this.jellyfishSpawnTimer = this.scene.time.addEvent({
      delay: 2000,
      callback: this.trySpawnJellyfish,
      callbackScope: this,
      loop: true,
    });
  }

  private trySpawnJellyfish(): void {
    if (this.scene.getIsGameOver()) return;

    let spawnChance = 1;
    if (this.depth > 100) {
      spawnChance += Math.floor((this.depth - 100) / 5) * 0.02;
    }
    spawnChance = Math.min(1.0, spawnChance);

    if (Math.random() < spawnChance) {
      this.spawnJellyfish();
    }
  }

  private spawnJellyfish(): void {
    const spawnSide = Math.random() * (this.scene.scale.width - 300) + 150;
    const spawnY = this.scene.cameras.main.worldView.bottom + 50;

    const jellyfish = this.jellyfishGroup.get(spawnSide, spawnY) as Jellyfish;
    if (jellyfish) {
      jellyfish.init();
    }
  }
}
