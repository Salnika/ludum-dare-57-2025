import Phaser from "phaser";
import GameScene from "./scenes/GameScene";
import PrepScene from "./scenes/PrepScene";
import PostScene from "./scenes/PostScene";
import LoadingScene from "./scenes/LoadingScene";
import PauseScene from "./scenes/PauseScene";
import PowerUpSelectionScene from "./scenes/PowerUpsSelectionScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.WEBGL,
  width: 1080,
  height: 608,
  backgroundColor: "#000000",
  physics: {
    default: "arcade",
    arcade: { debug: false },
  },
  input: {
    gamepad: true,
  },
  scene: [LoadingScene, PrepScene, GameScene, PauseScene, PowerUpSelectionScene, PostScene],
};

new Phaser.Game(config);
