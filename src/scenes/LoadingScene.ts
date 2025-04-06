import Phaser from "phaser";
import * as C from "../config/constants";

export default class LoadingScene extends Phaser.Scene {
  constructor() {
    super({ key: "LoadingScene" });
  }

  preload() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const loadingText = this.add
      .text(width / 2, height / 2 - 50, "Loading...", {
        fontSize: "32px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    const progressBar = this.add.rectangle(
      width / 2,
      height / 2,
      400,
      20,
      0x666666
    );
    const progressFill = this.add
      .rectangle(width / 2 - 198, height / 2, 0, 16, 0x00ff00)
      .setOrigin(0, 0.5);

    const assets = [
      {
        type: "spritesheet",
        key: C.ASSETS.SUBMARINE_SPRITESHEET,
        url: "assets/sub.png",
        config: { frameWidth: 773, frameHeight: 1024 },
      },
      {
        type: "image",
        key: C.ASSETS.BACKGROUND_IMAGE,
        url: "assets/background.png",
      },
      { type: "audio", key: C.ASSETS.TORPEDO_SOUND, url: "assets/torpedo.mp3" },
      {
        type: "spritesheet",
        key: C.ASSETS.JELLYFISH_SPRITESHEET,
        url: "assets/jellyfish-upscale.png",
        config: { frameWidth: 128, frameHeight: 128 },
      },
      {
        type: "image",
        key: C.ASSETS.TORPEDO_SPRITE,
        url: "assets/torpedo.png",
      },
/*       {
        type: "audio",
        key: C.ASSETS.BACKGROUND_SOUND,
        url: "assets/soundtrack.mp3",
      }, */
      {
        type: "audio",
        key: C.ASSETS.SONAR_PING_SOUND,
        url: "assets/sonar.mp3",
      },
    ];

    const totalAssets = assets.length;
    let loadedAssets = 0;

    this.load.on("filecomplete", (key: string) => {
      loadedAssets++;
      const progress = loadedAssets / totalAssets;
      console.log(`File loaded: ${key}, Progress: ${progress}`);
      progressFill.width = 396 * progress;
    });

    this.load.on("complete", () => {
      console.log("All assets loaded");
      loadingText.setText("Presse SPACE to play!");
      if (this.input.keyboard) {
        this.input.keyboard.on(
          "keydown-SPACE",
          () => this.scene.start("GameScene"),
          this
        );
      }
    });

    assets.forEach((asset) => {
      if (asset.type === "spritesheet") {
        this.load.spritesheet(asset.key, asset.url, asset.config);
      } else if (asset.type === "image") {
        this.load.image(asset.key, asset.url);
      } else if (asset.type === "audio") {
        this.load.audio(asset.key, asset.url);
      }
    });
  }

  create() {  }
}
