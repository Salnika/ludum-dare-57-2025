import Phaser from "phaser";
import { TorpedoType } from "../components/TorpedoTypes";

interface SaveData {
  points: number;
  hull: number;
  slots: number;
  torpedoes: {
    light: boolean;
    shock: boolean;
    explosion: boolean;
  };
}

export default class PrepScene extends Phaser.Scene {
  private slots: number = 0;
  private selectedTorpedoes: TorpedoType[] = [];
  private selectedTorpedoesText!: Phaser.GameObjects.Text;
  private selectedTorpedoesListText!: Phaser.GameObjects.Text;
  private torpedoButtons: { [key in TorpedoType]?: Phaser.GameObjects.Text } =
    {};
  private startButton!: Phaser.GameObjects.Text;

  private readonly FONT_STYLE_TITLE = {
    fontSize: "32px",
    color: "#ffffff",
    fontStyle: "bold",
  };
  private readonly FONT_STYLE_BUTTON = {
    fontSize: "24px",
    color: "#ffffff",
  };
  private readonly FONT_STYLE_LIST = {
    fontSize: "22px",
    color: "#ffffff",
    lineSpacing: 10,
  };
  private readonly COLOR_ACTIVE = "#ffffff";
  private readonly COLOR_INACTIVE = "#888888";
  private readonly COLOR_HOVER = "#ffff00";

  constructor() {
    super("PrepScene");
  }

  preload(): void {}

  create() {
    const { width, height } = this.cameras.main;
    this.cameras.main.setBackgroundColor("#1a1a2e");

    const savedDataString =
      localStorage.getItem("save") ||
      '{"points":0,"hull":1,"slots":3,"torpedoes":{"light":true,"shock":false,"explosion":false}}';
    const savedData: SaveData = JSON.parse(savedDataString);
    this.slots = savedData.slots;

    const torpedoes = savedData.torpedoes;

    this.displayTorpedoSelection(torpedoes, width * 0.25, height * 0.2);

    this.displaySelectedTorpedoes(width * 0.75, height * 0.2);

    this.startButton = this.add
      .text(width / 2, height * 0.85, "Enter the depth", this.FONT_STYLE_BUTTON)
      .setOrigin(0.5)
      .setColor(this.COLOR_INACTIVE);

    this.events.on(
      "selectedTorpedoChanged",
      () => this.displaySelectedTorpedoes(width * 0.75, height * 0.2),
      this
    );

    this.updateStartButtonState();
  }

  private displayTorpedoSelection(
    torpedoes: {
      light: boolean;
      shock: boolean;
      explosion: boolean;
    },
    x: number,
    startY: number
  ) {
    this.add
      .text(x, startY, "Choose your torpedoes:", this.FONT_STYLE_TITLE)
      .setOrigin(0.5, 0);

    let y = startY + 80;
    const buttonSpacing = 60;

    if (torpedoes.light) {
      this.torpedoButtons[TorpedoType.LIGHT] = this.createTorpedoButton(
        TorpedoType.LIGHT,
        x,
        y
      );
      y += buttonSpacing;
    }
    if (torpedoes.shock) {
      this.torpedoButtons[TorpedoType.SHOCK] = this.createTorpedoButton(
        TorpedoType.SHOCK,
        x,
        y
      );
      y += buttonSpacing;
    }
    if (torpedoes.explosion) {
      this.torpedoButtons[TorpedoType.EXPLOSION] = this.createTorpedoButton(
        TorpedoType.EXPLOSION,
        x,
        y
      );
      y += buttonSpacing;
    }
  }

  private createTorpedoButton(
    torpedoType: TorpedoType,
    x: number,
    y: number
  ): Phaser.GameObjects.Text {
    const button = this.add
      .text(x, y, `- ${torpedoType}`, this.FONT_STYLE_BUTTON)
      .setOrigin(0.5, 0)
      .setInteractive({ useHandCursor: true });

    button.on("pointerdown", () => {
      this.addTorpedo(torpedoType);
    });

    button.on("pointerover", () => {
      if (this.selectedTorpedoes.length < this.slots) {
        button.setColor(this.COLOR_HOVER);
      }
    });

    button.on("pointerout", () => {
      button.setColor(this.COLOR_ACTIVE);
    });

    return button;
  }

  private addTorpedo(torpedoType: TorpedoType) {
    if (this.selectedTorpedoes.length < this.slots) {
      this.selectedTorpedoes.push(torpedoType);
      this.events.emit("selectedTorpedoChanged");
    }
    Object.values(this.torpedoButtons).forEach((btn) => {
      if (btn) {
        const canAddMore = this.selectedTorpedoes.length < this.slots;
        btn.setColor(canAddMore ? this.COLOR_ACTIVE : this.COLOR_INACTIVE);
        if (!canAddMore) {
          btn.removeListener("pointerover");
          btn.removeListener("pointerout");
        } else {
          btn.on("pointerover", () => {
            btn.setColor(this.COLOR_HOVER);
          });
          btn.on("pointerout", () => {
            btn.setColor(this.COLOR_ACTIVE);
          });
        }
      }
    });
  }

  private displaySelectedTorpedoes(x: number, startY: number) {
    if (this.selectedTorpedoesText) this.selectedTorpedoesText.destroy();
    if (this.selectedTorpedoesListText)
      this.selectedTorpedoesListText.destroy();

    this.selectedTorpedoesText = this.add
      .text(x, startY, "Selected Torpedoes:", this.FONT_STYLE_TITLE)
      .setOrigin(0.5, 0);

    let torpedoListString = "";
    if (this.selectedTorpedoes.length === 0) {
      torpedoListString = "None";
    } else {
      this.selectedTorpedoes.forEach((torpedoType) => {
        torpedoListString += `- ${torpedoType}\n`;
      });
    }

    const listY = startY + 80;

    this.selectedTorpedoesListText = this.add
      .text(x, listY, torpedoListString.trim(), this.FONT_STYLE_LIST)
      .setOrigin(0.5, 0);

    this.updateTorpedoButtonStates();
    this.updateStartButtonState();
  }

  private updateTorpedoButtonStates() {
    const canAddMore = this.selectedTorpedoes.length < this.slots;
    Object.values(this.torpedoButtons).forEach((btn) => {
      if (btn) {
        btn.setColor(canAddMore ? this.COLOR_ACTIVE : this.COLOR_INACTIVE);

        btn.removeListener("pointerover");
        btn.removeListener("pointerout");

        if (canAddMore) {
          btn.on("pointerover", () => btn.setColor(this.COLOR_HOVER));
          btn.on("pointerout", () => btn.setColor(this.COLOR_ACTIVE));
        } else {
          btn.setColor(this.COLOR_INACTIVE);
        }
      }
    });
  }

  private startGame() {
    if (this.selectedTorpedoes.length >= 1) {
      this.scene.start("GameScene", { torpedoes: this.selectedTorpedoes });
    }
  }

  private updateStartButtonState() {
    if (!this.startButton) return;

    this.startButton.removeListener("pointerdown");
    this.startButton.removeListener("pointerover");
    this.startButton.removeListener("pointerout");

    if (this.selectedTorpedoes.length >= 1) {
      this.startButton.setColor(this.COLOR_ACTIVE);
      this.startButton.setInteractive({ useHandCursor: true });
      this.startButton.on("pointerdown", this.startGame, this);
      this.startButton.on("pointerover", () =>
        this.startButton.setColor(this.COLOR_HOVER)
      );
      this.startButton.on("pointerout", () =>
        this.startButton.setColor(this.COLOR_ACTIVE)
      );
    } else {
      this.startButton.setColor(this.COLOR_INACTIVE);
      this.startButton.disableInteractive();
    }
  }
}
