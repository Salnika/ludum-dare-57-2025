import Phaser from "phaser";
import Player from "../components/Player";
import * as C from "../config/constants";
import GameScene from "./GameScene";

export default class LightingManager {
  private submarineLight!: Phaser.GameObjects.PointLight;
  private coneLight!: Phaser.GameObjects.PointLight;

  constructor(private scene: GameScene, private player: Player) {}

  setupLighting(): void {
    this.scene.lights.enable().setAmbientColor(0x101010);

    this.submarineLight = this.scene.add.pointlight(0, 0, 0x73a9d6, 150);
    this.submarineLight.setDepth(C.DEPTH_LIGHT);
    this.submarineLight.radius = 200;
    this.submarineLight.attenuation = 0.03;

    this.coneLight = this.scene.add.pointlight(0, 0, 0xffc000, 300);
    this.coneLight.radius = 300;
    this.coneLight.attenuation = 0.03;
  }

  updateLighting(targetX: number, targetY: number, depth: number): void {
    const ambientLightIntensity = Phaser.Math.Clamp(
      0.5 + (2.0 - depth / 10) * 0.5,
      0.05,
      1
    );
    const ambientColorValue = Phaser.Display.Color.HSVToRGB(
      0.6,
      0.5,
      ambientLightIntensity
    ).color;
    const ambientColor = Phaser.Display.Color.ValueToColor(ambientColorValue);
    this.scene.lights.setAmbientColor(ambientColor.color);

    this.submarineLight.intensity = Phaser.Math.Clamp(
      0.7 + depth / 10,
      0.7,
      2.0
    );

    const playerPos = this.player.getPosition();
    this.submarineLight.setPosition(playerPos.x, playerPos.y);

    const angle = Phaser.Math.Angle.Between(
      playerPos.x,
      playerPos.y,
      targetX,
      targetY
    );
    const coneDistance = 150;
    const coneX = playerPos.x + Math.cos(angle) * coneDistance;
    const coneY = playerPos.y + Math.sin(angle) * coneDistance;
    this.coneLight.setPosition(coneX, coneY);

    const distanceToTarget = Phaser.Math.Distance.Between(
      playerPos.x,
      playerPos.y,
      targetX,
      targetY
    );
    this.coneLight.radius = Phaser.Math.Clamp(distanceToTarget * 0.8, 150, 400);
    this.coneLight.intensity = 1.5;
  }
}
