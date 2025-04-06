// src/scenes/PowerUpSelectionScene.ts
import Phaser from "phaser";
import { PowerUp, getRandomPowerUps } from "../config/PowerUps";

export default class PowerUpSelectionScene extends Phaser.Scene {
  private callingSceneKey!: string;
  private availablePowerUps: PowerUp[] = [];

  private readonly FONT_STYLE_TITLE = {
    fontSize: "36px",
    color: "#ffffff",
    fontStyle: "bold",
  };
  private readonly FONT_STYLE_CARD_NAME = {
    fontSize: "24px",
    color: "#ffffff",
    fontStyle: "bold",
  };
  private readonly FONT_STYLE_CARD_DESC = {
    fontSize: "18px",
    color: "#dddddd",
    wordWrap: { width: 280, useAdvancedWrap: true },
    align: "center",
  };
  private readonly CARD_WIDTH = 300;
  private readonly CARD_HEIGHT = 200;
  private readonly CARD_BG_COLOR = 0x0a0a1e;
  private readonly CARD_BORDER_COLOR = 0x00ffff;
  private readonly CARD_HOVER_BORDER_COLOR = 0xffff00;
  private readonly CARD_BORDER_THICKNESS = 2;

  constructor() {
    super("PowerUpSelectionScene");
  }

  init(data: { callerSceneKey: string }) {
    this.callingSceneKey = data.callerSceneKey;
    if (!this.callingSceneKey) {
    }
    this.availablePowerUps = getRandomPowerUps(3);
  }

  preload(): void {}

  create() {
    if (!this.callingSceneKey) return;

    const { width, height } = this.cameras.main;

    const overlay = this.add
      .rectangle(0, 0, width, height, 0x000000, 0.7)
      .setOrigin(0, 0);
    overlay.setInteractive();

    this.add
      .text(
        width / 2,
        height * 0.15,
        "CHOOSE AN UPGRADE",
        this.FONT_STYLE_TITLE
      )
      .setOrigin(0.5);

    const totalCardWidth = this.availablePowerUps.length * this.CARD_WIDTH;
    const spacing =
      (width - totalCardWidth) / (this.availablePowerUps.length + 1);
    let startX = spacing;

    this.availablePowerUps.forEach((powerUp, index) => {
      const cardX =
        startX + index * (this.CARD_WIDTH + spacing) + this.CARD_WIDTH / 2;
      const cardY = height / 2;

      this.createPowerUpCard(cardX, cardY, powerUp);
    });
  }

  private createPowerUpCard(x: number, y: number, powerUp: PowerUp) {
    const cardContainer = this.add.container(x, y);

    const cardBackground = this.add.graphics();
    cardBackground.fillStyle(this.CARD_BG_COLOR, 0.9);
    cardBackground.lineStyle(
      this.CARD_BORDER_THICKNESS,
      this.CARD_BORDER_COLOR,
      1
    );
    cardBackground.fillRect(
      -this.CARD_WIDTH / 2,
      -this.CARD_HEIGHT / 2,
      this.CARD_WIDTH,
      this.CARD_HEIGHT
    );
    cardBackground.strokeRect(
      -this.CARD_WIDTH / 2,
      -this.CARD_HEIGHT / 2,
      this.CARD_WIDTH,
      this.CARD_HEIGHT
    );
    cardContainer.add(cardBackground);

    const nameText = this.add
      .text(
        0,
        -this.CARD_HEIGHT / 2 + 30,
        powerUp.name,
        this.FONT_STYLE_CARD_NAME
      )
      .setOrigin(0.5);
    cardContainer.add(nameText);

    const descText = this.add
      .text(0, 0, powerUp.description, this.FONT_STYLE_CARD_DESC)
      .setOrigin(0.5);
    cardContainer.add(descText);

    const hitArea = new Phaser.Geom.Rectangle(
      -this.CARD_WIDTH / 2,
      -this.CARD_HEIGHT / 2,
      this.CARD_WIDTH,
      this.CARD_HEIGHT
    );
    cardContainer.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
    cardContainer.setData("powerUpKey", powerUp.key);

    cardContainer.on(Phaser.Input.Events.POINTER_OVER, () => {
      cardBackground.clear();
      cardBackground.fillStyle(this.CARD_BG_COLOR, 0.9);
      cardBackground.lineStyle(
        this.CARD_BORDER_THICKNESS + 1,
        this.CARD_HOVER_BORDER_COLOR,
        1
      );
      cardBackground.fillRect(
        -this.CARD_WIDTH / 2,
        -this.CARD_HEIGHT / 2,
        this.CARD_WIDTH,
        this.CARD_HEIGHT
      );
      cardBackground.strokeRect(
        -this.CARD_WIDTH / 2,
        -this.CARD_HEIGHT / 2,
        this.CARD_WIDTH,
        this.CARD_HEIGHT
      );
    });

    cardContainer.on(Phaser.Input.Events.POINTER_OUT, () => {
      cardBackground.clear();
      cardBackground.fillStyle(this.CARD_BG_COLOR, 0.9);
      cardBackground.lineStyle(
        this.CARD_BORDER_THICKNESS,
        this.CARD_BORDER_COLOR,
        1
      );
      cardBackground.fillRect(
        -this.CARD_WIDTH / 2,
        -this.CARD_HEIGHT / 2,
        this.CARD_WIDTH,
        this.CARD_HEIGHT
      );
      cardBackground.strokeRect(
        -this.CARD_WIDTH / 2,
        -this.CARD_HEIGHT / 2,
        this.CARD_WIDTH,
        this.CARD_HEIGHT
      );
    });

    cardContainer.on(Phaser.Input.Events.POINTER_DOWN, () => {
      this.selectPowerUp(powerUp.key);
    });
  }

  private selectPowerUp(powerUpKey: string) {
    const callingScene = this.scene.get(this.callingSceneKey);

    if (callingScene && callingScene.events) {
      callingScene.events.emit("powerUpChosen", powerUpKey);
    } else {
    }

    // @ts-expect-error
    this.scene.get("GameScene").resume(null, powerUpKey);
    this.scene.stop();
  }
}
