import Phaser from 'phaser'
import GameScene from './scenes/GameScene'
import PrepScene from './scenes/PrepScene'
import PostScene from './scenes/PostScene'

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.WEBGL,
  width: 1080,
  height: 1350,
  backgroundColor: "#000000",
  physics: {
    default: "arcade",
    arcade: { debug: false },
  },
  input: {
    gamepad: true
},
  scene: GameScene,
};

new Phaser.Game(config)
