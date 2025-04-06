import Phaser from "phaser";

export default class PauseScene extends Phaser.Scene {
  constructor() {
    super('PauseScene');
  }

  create() {
    this.add.rectangle(
      this.scale.width / 2,
      this.scale.height / 2,
      this.scale.width,
      this.scale.height,
      0x000000,
      0.7
    ).setOrigin(0.5);

    this.add
      .text(this.scale.width / 2, this.scale.height * 0.3, "Paused", {
        fontSize: "64px",
        fontFamily: "Arial",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    this.add
      .text(this.scale.width / 2, this.scale.height * 0.5, "Resume", {
        fontSize: "32px",
        fontFamily: "Arial",
        color: "#ffffff",
      })
      .setOrigin(0.5)
      .setInteractive()
      .on("pointerdown", () => this.resumeGame())
      .on("pointerover", (item:Phaser.GameObjects.Text) => item.setColor("#ff0"))
      .on("pointerout", (item:Phaser.GameObjects.Text) => item.setColor('#fff'))

    this.add
      .text(this.scale.width / 2, this.scale.height * 0.6, "Restart", {
        fontSize: "32px",
        fontFamily: "Arial",
        color: "#ffffff",
      })
      .setOrigin(0.5)
      .setInteractive()
      .on("pointerdown", () => this.restartGame())
      .on("pointerover", (item:Phaser.GameObjects.Text) => item.setColor("#ff0"))
      .on("pointerout", (item:Phaser.GameObjects.Text) => item.setColor('#fff'))


    this.input.keyboard?.on("keydown-ESC", () => this.resumeGame());
  }

  resumeGame() {
    this.scene.get('GameScene').resumeGame()
    this.scene.stop();
  }

  restartGame() {
    this.scene.get('GameScene').resumeGame()
    this.scene.stop("GameScene");
    this.scene.start("LoadingScene");
    this.scene.stop();
  }
}