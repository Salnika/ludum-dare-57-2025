import * as C from "../config/constants";

export default class AnimationManager {
  constructor(private scene: Phaser.Scene) {}

  createAnimations(): void {
    if (!this.scene.anims.exists("explosion")) {
      this.scene.anims.create({
        key: "explosion",
        frames: this.scene.anims.generateFrameNumbers(
          C.ASSETS.EXPLOSION_SPRITESHEET,
          { start: 0, end: 8 }
        ),
        frameRate: 10,
        repeat: 0,
      });
    }
    if (!this.scene.anims.exists("shock")) {
      this.scene.anims.create({
        key: "shock",
        frames: this.scene.anims.generateFrameNumbers(
          C.ASSETS.SHOCK_SPRITESHEET,
          {
            start: 0,
            end: 8,
          }
        ),
        frameRate: 10,
        repeat: 0,
      });
    }
    if (!this.scene.anims.exists("jellyfish_idle")) {
      this.scene.anims.create({
        key: "jellyfish_idle",
        frames: this.scene.anims.generateFrameNumbers(
          C.ASSETS.JELLYFISH_SPRITESHEET,
          { start: 0, end: 4 }
        ),
        frameRate: 6,
        repeat: -1,
      });
    }
    if (!this.scene.anims.exists("jellyfish_swim")) {
      this.scene.anims.create({
        key: "jellyfish_swim",
        frames: this.scene.anims.generateFrameNumbers(
          C.ASSETS.JELLYFISH_SPRITESHEET,
          { start: 7, end: 11 }
        ),
        frameRate: 6,
        repeat: -1,
      });
    }
    if (!this.scene.anims.exists("jellyfish_swim2")) {
      this.scene.anims.create({
        key: "jellyfish_swim2",
        frames: this.scene.anims.generateFrameNumbers(
          C.ASSETS.JELLYFISH_SPRITESHEET,
          { start: 15, end: 18 }
        ),
        frameRate: 6,
        repeat: -1,
      });
    }
    if (!this.scene.anims.exists("jellyfish_die")) {
      this.scene.anims.create({
        key: "jellyfish_die",
        frames: this.scene.anims.generateFrameNumbers(
          C.ASSETS.JELLYFISH_SPRITESHEET,
          { start: 21, end: 27 }
        ),
        frameRate: 6,
        repeat: 0,
      });
    }
  }
}
