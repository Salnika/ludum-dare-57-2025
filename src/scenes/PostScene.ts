import Phaser from "phaser";

export default class PostScene extends Phaser.Scene {
  constructor() {
    super("PostScene");
  }

  create(data: { points: number }) {
    const save = JSON.parse(
      localStorage.getItem("save") ||
        '{"points":0,"hull":1,"slots":3,"torpedoes":{"light":true,"stun":false,"blast":false}}'
    );
    console.log(data)
    save.points = parseInt(data.points)  + parseInt(save.points);
    localStorage.setItem("save", JSON.stringify(save));
    console.log(save)
    this.add.text(100, 100, `Points: ${save.points}`, {
      fontSize: "28px",
      color: "#fff",
    });

    let y = 160;
    const upgrades = [
      { label: "Coque +1 (500)", key: "hull", cost: 500, max: 3 },
      { label: "Torpilles +1 (300)", key: "slots", cost: 300, max: 6 },
      {
        label: "Débloquer stun (500)",
        key: "stun",
        cost: 500,
        type: "torpedoes",
      },
      {
        label: "Débloquer blast (1000)",
        key: "blast",
        cost: 1000,
        type: "torpedoes",
      },
    ];

    upgrades.forEach((upg) => {
      const canBuy = upg.type
        ? !save.torpedoes[upg.key]
        : save[upg.key] < (upg.max ?? Infinity);
      const text = this.add.text(100, y, upg.label, {
        fontSize: "20px",
        color: canBuy ? "#0f0" : "#888",
      });
      if (canBuy) {
        text.setInteractive();
        text.on("pointerdown", () => {
          if (save.points >= upg.cost) {
            save.points -= upg.cost;
            if (upg.type) save.torpedoes[upg.key] = true;
            else save[upg.key] += 1;
            localStorage.setItem("save", JSON.stringify(save));
            this.scene.restart();
          }
        });
      }
      y += 40;
    });

    this.add
      .text(100, y + 40, "Rejouer", { fontSize: "24px", color: "#fff" })
      .setInteractive()
      .on("pointerdown", () => {
        this.scene.stop();
        this.scene.start("LoadingScene");
      });
  }
}
