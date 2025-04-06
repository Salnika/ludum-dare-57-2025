import Phaser from "phaser";
import * as C from "../config/constants";

export default class UIManager {
  private scene: Phaser.Scene;
  private depthText!: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  create(): void {
    this.depthText = this.scene.add
      .text(this.scene.scale.width - 20, 20, "Profondeur: 0 m", {
        fontSize: "16px",
        color: "#ffffff",
        align: "right",
      })
      .setOrigin(1, 0)
      .setDepth(C.DEPTH_TEXT)
      .setScrollFactor(0);

    
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(0xff0000, 1);
    graphics.fillRect(0, 0,2, 2);
    graphics.generateTexture("redPixel", 1, 1);
    graphics.destroy(); 
  }

  updateDepthText(depth: number): void {
    if (this.depthText?.active) {
      this.depthText.setText(`Profondeur: ${Math.floor(depth)} m`);
    }
  }
}
