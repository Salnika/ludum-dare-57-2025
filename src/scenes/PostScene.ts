import Phaser from "phaser";

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

export default class PostScene extends Phaser.Scene {
  private saveData!: SaveData;
  private pointsText!: Phaser.GameObjects.Text;

  private readonly FONT_STYLE_TITLE = {
    fontSize: "32px",
    color: "#ffffff",
    fontStyle: "bold",
  };
  private readonly FONT_STYLE_POINTS = {
    fontSize: "28px",
    color: "#ffd700",
  };
  private readonly FONT_STYLE_UPGRADE_ACTIVE = {
    fontSize: "22px",
    color: "#00ff00",
  };
  private readonly FONT_STYLE_UPGRADE_MAXED = {
    fontSize: "22px",
    color: "#ffff00",
  };
  private readonly FONT_STYLE_UPGRADE_INACTIVE = {
    fontSize: "22px",
    color: "#888888",
  };
  private readonly FONT_STYLE_UPGRADE_CANT_AFFORD = {
    fontSize: "22px",
    color: "#ff6666",
  };
  private readonly FONT_STYLE_BUTTON = {
    fontSize: "26px",
    color: "#ffffff",
  };
  private readonly COLOR_HOVER = "#ffff00";
  private readonly COLOR_ACTIVE = "#ffffff";

  constructor() {
    super("PostScene");
  }

  create(data: { points: number }) {
    const { width, height } = this.cameras.main;
    this.cameras.main.setBackgroundColor("#1a1a2e");

    const saveString =
      localStorage.getItem("save") ||
      '{"points":0,"hull":1,"slots":3,"torpedoes":{"light":true,"shock":false,"explosion":false}}';
    this.saveData = JSON.parse(saveString);

    const earnedPoints = Number(data.points) || 0;
    const currentPoints = Number(this.saveData.points) || 0;
    this.saveData.points = earnedPoints + currentPoints;

    localStorage.setItem("save", JSON.stringify(this.saveData));

    this.add
      .text(width / 2, height * 0.1, "You went too deep", this.FONT_STYLE_TITLE)
      .setOrigin(0.5);

    this.pointsText = this.add
      .text(
        width / 2,
        height * 0.2,
        `Points: ${this.saveData.points}`,
        this.FONT_STYLE_POINTS
      )
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.3, "Upgrades", this.FONT_STYLE_TITLE)
      .setOrigin(0.5);
    this.displayUpgrades(width / 2, height * 0.38);

    const replayButton = this.add
      .text(width / 2, height * 0.85, "Start again", this.FONT_STYLE_BUTTON)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    replayButton.on("pointerdown", () => {
      this.scene.stop();
      this.scene.start("LoadingScene");
    });

    replayButton.on("pointerover", () =>
      replayButton.setColor(this.COLOR_HOVER)
    );
    replayButton.on("pointerout", () =>
      replayButton.setColor(this.COLOR_ACTIVE)
    );
  }

  private displayUpgrades(x: number, startY: number) {
    const upgrades = [
      {
        label: "Hull +1",
        key: "hull",
        cost: 500,
        max: 3,
        current: this.saveData.hull,
      },
      {
        label: "Torpedoes slots +1",
        key: "slots",
        cost: 300,
        max: 6,
        current: this.saveData.slots,
      },
      {
        label: "Unlock Stun torpedoe",
        key: "shock",
        cost: 500,
        type: "torpedoes",
        current: this.saveData.torpedoes.shock,
      },
      {
        label: "Unlock Blast Torpedoe",
        key: "explosion",
        cost: 1000,
        type: "torpedoes",
        current: this.saveData.torpedoes.explosion,
      },
    ];

    let y = startY;
    const upgradeSpacing = 50;

    upgrades.forEach((upg) => {
      const isTorpedo = upg.type === "torpedoes";
      const isOwnedOrMaxed = isTorpedo
        ? upg.current
        : // @ts-expect-error
          upg.current >= (upg.max ?? Infinity);
      const canAfford = this.saveData.points >= upg.cost;

      let displayText = `${upg.label} (${upg.cost} Pts)`;
      if (!isTorpedo) {
        displayText += ` [${upg.current}/${upg.max}]`;
      } else if (isOwnedOrMaxed) {
        displayText = `${upg.label} (Unlocked)`;
      }

      let style = this.FONT_STYLE_UPGRADE_INACTIVE;
      let interactive = false;

      if (isOwnedOrMaxed) {
        style = this.FONT_STYLE_UPGRADE_MAXED;
      } else if (canAfford) {
        style = this.FONT_STYLE_UPGRADE_ACTIVE;
        interactive = true;
      } else {
        style = this.FONT_STYLE_UPGRADE_CANT_AFFORD;
      }

      const text = this.add.text(x, y, displayText, style).setOrigin(0.5);

      if (interactive) {
        text.setInteractive({ useHandCursor: true });
        text.on("pointerdown", () => {
          this.purchaseUpgrade(upg.key, upg.cost, upg.type);
        });
        text.on("pointerover", () => text.setColor(this.COLOR_HOVER));
        text.on("pointerout", () =>
          text.setColor(this.FONT_STYLE_UPGRADE_ACTIVE.color)
        );
      }

      y += upgradeSpacing;
    });
  }

  private purchaseUpgrade(key: string, cost: number, type?: string) {
    if (this.saveData.points >= cost) {
      this.saveData.points -= cost;

      if (type === "torpedoes") {
        // @ts-expect-error - Dynamically accessing torpedo type is intended here
        this.saveData.torpedoes[key] = true;
      } else {
        // @ts-expect-error - Dynamically accessing hull/slots is intended here
        this.saveData[key] += 1;
      }

      localStorage.setItem("save", JSON.stringify(this.saveData));
      this.scene.restart({ points: 0 });
    }
  }
}
