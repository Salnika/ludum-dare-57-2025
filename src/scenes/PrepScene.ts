import Phaser from "phaser";
import {
  TorpedoType,
} from "../components/TorpedoTypes";
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
  private startButton?: Phaser.GameObjects.Text; 

  constructor() {
    super("PrepScene");
  }

  preload(): void {
  }

  create() {
    const savedDataString =
      localStorage.getItem("save") ||
      '{"points":0,"hull":1,"slots":3,"torpedoes":{"light":true,"shock":false,"explosion":false}}';
    const savedData: SaveData = JSON.parse(savedDataString);
    this.slots = savedData.slots; 

    const torpedoes = savedData.torpedoes;

    this.displayTorpedoSelection(torpedoes);

    this.displaySelectedTorpedoes();

    this.startButton = this.add.text(100, 500, "Commencer la partie", {
      fontSize: "24px",
      color: "#888", 
    });
    this.startButton.setInteractive({ useHandCursor: false }); 
    this.startButton.on("pointerdown", () => {
      this.startGame();
    });
    this.startButton.disableInteractive(); 

    this.events.on(
      "selectedTorpedoChanged",
      this.displaySelectedTorpedoes,
      this
    );
  }

  private displayTorpedoSelection(torpedoes: {
    light: boolean;
    shock: boolean;
    explosion: boolean;
  }) {
    let y = 200;
    this.add.text(100, 150, "Sélectionnez vos torpilles:", {
      fontSize: "24px",
      color: "#fff",
    });

    if (torpedoes.light) {
      this.torpedoButtons[TorpedoType.LIGHT] = this.createTorpedoButton(
        TorpedoType.LIGHT,
        100,
        y
      );
      y += 40;
    }
    if (torpedoes.shock) {
      this.torpedoButtons[TorpedoType.SHOCK] = this.createTorpedoButton(
        TorpedoType.SHOCK,
        100,
        y
      );
      y += 40;
    }
    if (torpedoes.explosion) {
      this.torpedoButtons[TorpedoType.EXPLOSION] = this.createTorpedoButton(
        TorpedoType.EXPLOSION,
        100,
        y
      );
      y += 40;
    }
  }

  private createTorpedoButton(
    torpedoType: TorpedoType,
    x: number,
    y: number
  ): Phaser.GameObjects.Text {
    const button = this.add.text(x, y, `- ${torpedoType}`, {
      fontSize: "20px",
      color: "#fff",
    });
    button.setInteractive();
    button.on("pointerdown", () => {
      this.addTorpedo(torpedoType); 
    });
    return button;
  }

  private addTorpedo(torpedoType: TorpedoType) {
    if (this.selectedTorpedoes.length < this.slots) {
      this.selectedTorpedoes.push(torpedoType);
      this.events.emit("selectedTorpedoChanged");
      this.updateStartButtonState();
    }
  }

  private displaySelectedTorpedoes() {
    if (this.selectedTorpedoesText) {
      this.selectedTorpedoesText.destroy();
    }
    if (this.selectedTorpedoesListText) {
      this.selectedTorpedoesListText.destroy();
    }

    this.selectedTorpedoesText = this.add.text(
      400,
      150,
      "Torpedos Sélectionnés:",
      {
        fontSize: "24px",
        color: "#fff",
      }
    );

    let y = 200;
    let torpedoListString = "";
    this.selectedTorpedoes.forEach((torpedoType) => {
      torpedoListString += `- ${torpedoType}\n`;
      y += 30; 
    });

    this.selectedTorpedoesListText = this.add.text(
      400,
      200,
      torpedoListString,
      {
        fontSize: "20px",
        color: "#fff",
      }
    );
    this.updateStartButtonState(); 
  }

  private startGame() {
    if (this.selectedTorpedoes.length === this.slots) {
      this.scene.start("GameScene", { torpedoes: this.selectedTorpedoes });
    }
  }

  private updateStartButtonState() {
    if (!this.startButton) return; //Check if startButton exists

    if (this.selectedTorpedoes.length === this.slots) {
      this.startButton.setColor("#fff");
      this.startButton.setInteractive({ useHandCursor: true });
    } else {
      this.startButton.setColor("#888");
      this.startButton.setInteractive({ useHandCursor: false });
      this.startButton.disableInteractive();
    }
  }
}
