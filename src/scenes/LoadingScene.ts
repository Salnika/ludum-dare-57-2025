import Phaser from "phaser";
import * as C from "../config/constants";

export default class LoadingScene extends Phaser.Scene {
  private gamepad: Phaser.Input.Gamepad.Gamepad | undefined;
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
        type: "spritesheet",
        key: C.ASSETS.EXPLOSION_SPRITESHEET,
        url: "assets/explosion.png",
        config: { frameWidth: 128, frameHeight: 128 },
      },
      {
        type: "spritesheet",
        key: C.ASSETS.SHOCK_SPRITESHEET,
        url: "assets/shock.png",
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
      progressFill.width = 396 * progress;
    });

    this.load.on("complete", () => {
      loadingText.setText("Press START or SPACE to play!");
      this.setupStartInput();
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

  private setupStartInput() {
    if (this.input.keyboard) {
      this.input.keyboard.once("keydown-SPACE", () => this.startGame(), this);
    }

    if (!this.input.gamepad) {
      return;
    }
    this.input.gamepad.once(
      "connected",
      (pad: Phaser.Input.Gamepad.Gamepad) => {
        this.gamepad = pad;
        this.setupStartInput();
      },
      this
    );
    if (this.gamepad) {
      this.gamepad.on(
        Phaser.Input.Gamepad.Events.BUTTON_DOWN,
        (button: number) => {
          if (button === 0) {
            this.startGame();
          }
        },
        this
      );
    }
  }

  private async startGame() {
    if (this.gamepad) {
      this.gamepad.removeAllListeners();
    }
    this.scene.start("GameScene");
  }

  create() {}
}
