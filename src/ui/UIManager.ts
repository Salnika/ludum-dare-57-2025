import Phaser from "phaser";
import * as C from "../config/constants";
import { TorpedoType } from "../components/TorpedoTypes";
import GameScene from "../scenes/GameScene";

export default class UIManager {
  private scene: GameScene;
  private depthText!: Phaser.GameObjects.Text;
  private torpedoInfoTexts: Map<TorpedoType, Phaser.GameObjects.Text> =
    new Map();
  private torpedoDisplayGroup!: Phaser.GameObjects.Group;

  constructor(scene: GameScene) {
    this.scene = scene;
  }

  create(): void {
    console.log('ICI')
    this.depthText = this.scene.add
      .text(this.scene.scale.width - 20, 20, "Profondeur: 0 m", {
        fontSize: "16px",
        color: "#ffffff",
        align: "right",
        stroke: "#000000",
        strokeThickness: 3,
      })
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
  }

  createTorpedoDisplay(
    initialCounts: Map<TorpedoType, number>,
    selectedType: TorpedoType | undefined
  ): void {
    let yPos = 20;
    const xPos = 20;
    const yIncrement = 20;

    this.torpedoDisplayGroup.clear(true, true);
    this.torpedoInfoTexts.clear();

    // @ts-expect-error
    const sortedTypes = Array.from(initialCounts.keys()).sort((a, b) => a - b);

    sortedTypes.forEach((type) => {
      const count = initialCounts.get(type) ?? 0;
      const typeName = TorpedoType[type];

      const text = this.scene.add
        .text(xPos, yPos, `${typeName}: ${count}`, {
          fontSize: "14px",
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
      } else {
      }
    });
  }

  updateDepthText(depth: number): void {
    if (this.depthText?.active) {
      this.depthText.setText(`Profondeur: ${Math.floor(depth)} m`);
    }
  }
}
