import Phaser from "phaser";
import * as C from "../config/constants";
import { TorpedoType } from "../components/TorpedoTypes";
import GameScene from "../scenes/GameScene";

export default class UIManager {
  private scene: GameScene;
  private depthText!: Phaser.GameObjects.Text;
  private hullLifeText!: Phaser.GameObjects.Text; // Nouvelle propriété
  private torpedoInfoTexts: Map<TorpedoType, Phaser.GameObjects.Text> =
    new Map();
  private torpedoDisplayGroup!: Phaser.GameObjects.Group;
  private energyBar!: Phaser.GameObjects.Graphics;
  private energyPercentageText!: Phaser.GameObjects.Text;

  constructor(scene: GameScene) {
    this.scene = scene;
  }

  create(): void {
    this.depthText = this.scene.add
      .text(this.scene.scale.width - 20, 20, "Depth: 0 m", {
        fontSize: "34px",
        color: "#ffffff",
        align: "right",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(1, 0)
      .setDepth(C.DEPTH_TEXT)
      .setScrollFactor(0);

    this.hullLifeText = this.scene.add
      .text(
        this.scene.scale.width - 20,
        60,
        `Hull: ${this.scene.player.hullLife}`,
        {
          fontSize: "34px",
          color: "#ffffff",
          align: "right",
          stroke: "#000000",
          strokeThickness: 3,
        }
      )
      .setOrigin(1, 0)
      .setDepth(C.DEPTH_TEXT)
      .setScrollFactor(0);

    this.torpedoDisplayGroup = this.scene.add.group();

    if (!this.scene.textures.exists("redPixel")) {
      const graphics = this.scene.add.graphics();
      graphics.fillStyle(0xff0000, 1);
      graphics.fillRect(0, 0, 1, 1);
      graphics.generateTexture("redPixel", 1, 1);
      graphics.destroy();
    }

    this.energyBar = this.scene.add.graphics();
    this.energyPercentageText = this.scene.add
      .text(0, 0, "100%", {
        fontSize: "32px",
        color: "#000000",
        align: "center",
      })
      .setOrigin(0.5);
    this.updateEnergyBar();
  }

  createTorpedoDisplay(
    initialCounts: Map<TorpedoType, number>,
    selectedType: TorpedoType | undefined
  ): void {
    let yPos = 20;
    const xPos = 20;
    const yIncrement = 25;

    this.torpedoDisplayGroup.clear(true, true);
    this.torpedoInfoTexts.clear();

    // @ts-expect-error
    const sortedTypes = Array.from(initialCounts.keys()).sort((a, b) => a - b);

    sortedTypes.forEach((type) => {
      const count = initialCounts.get(type) ?? 0;
      const typeName = TorpedoType[type];

      const text = this.scene.add
        .text(xPos, yPos, `${typeName}: ${count}`, {
          fontSize: "20px",
          color: "#ffffff",
          stroke: "#000000",
          strokeThickness: 2,
        })
        .setDepth(C.DEPTH_TEXT)
        .setScrollFactor(0);

      this.torpedoInfoTexts.set(type, text);
      this.torpedoDisplayGroup.add(text);
      yPos += yIncrement;
    });

    if (selectedType !== undefined) {
      this.updateTorpedoInfo(initialCounts, selectedType);
    }
  }

  updateTorpedoInfo(
    counts: Map<TorpedoType, number>,
    selectedType: TorpedoType
  ): void {
    this.torpedoInfoTexts.forEach((text, type) => {
      if (text?.active) {
        const count = counts.get(type) ?? 0;
        const prefix = type === selectedType ? "> " : "  ";
        const typeName = TorpedoType[type];

        text.setText(`${prefix}${typeName}: ${count}`);
        text.setColor(
          type === selectedType
            ? C.COLORS.TORPEDO_SELECTED
            : C.COLORS.TORPEDO_DEFAULT
        );
      }
    });
  }

  updateDepthText(depth: number): void {
    if (this.depthText?.active) {
      this.depthText.setText(`Profondeur: ${Math.floor(depth)} m`);
    }
  }

  updateHullLife(): void {
    if (this.hullLifeText?.active) {
      this.hullLifeText.setText(`Coque: ${this.scene.player.hullLife}`);
    }
  }

  updateEnergyBar(): void {
    const width = this.scene.scale.width / 2;
    const height = 20;
    const percentage = this.scene.sonar.energy / 100;
    const barWidth = width * percentage;
    const x = (this.scene.scale.width - width) / 2;
    const yPos = this.scene.scale.height - height;

    this.energyBar.clear();
    this.energyBar.fillStyle(0x00ff00, 1);
    this.energyBar.fillRect(x, yPos - 50, barWidth, height);
    this.energyBar.lineStyle(1, 0x000000, 1);
    this.energyBar.strokeRect(x, yPos - 50, width, height);
    this.energyBar.setDepth(C.DEPTH_TEXT).setScrollFactor(0);

    this.energyPercentageText.setText(
      `${Math.round(this.scene.sonar.energy)}%`
    );
    this.energyPercentageText.x = x + width / 2;
    this.energyPercentageText.y = yPos - 50 + height / 2;
    this.energyPercentageText.setDepth(C.DEPTH_TEXT).setScrollFactor(0);
  }
}
