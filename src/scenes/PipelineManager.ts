import outlinePipelineInstanceBackground from "../shaders/outline";
import GameScene from "./GameScene";

export default class PipelineManager {
  private outlinePipelineInstanceBackground!: outlinePipelineInstanceBackground;

  constructor(private scene: GameScene) {
    this.outlinePipelineInstanceBackground =
      new outlinePipelineInstanceBackground(this.scene.game);
  }

  getOutlinePipeline(): outlinePipelineInstanceBackground {
    return this.outlinePipelineInstanceBackground;
  }

  registerAndConfigureOutlinePipeline(): void {
    const renderer = this.scene.game.renderer;
    if (renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer) {
      if (!renderer.pipelines.has(outlinePipelineInstanceBackground.KEY)) {
        renderer.pipelines.add(
          outlinePipelineInstanceBackground.KEY,
          this.outlinePipelineInstanceBackground
        );
      }
      this.outlinePipelineInstanceBackground.setOutlineColor(0x00ff00, 1.0);
      this.outlinePipelineInstanceBackground.setThickness(2);
      this.outlinePipelineInstanceBackground.setThreshold(0.1);
      this.outlinePipelineInstanceBackground.setSonarProperties(0, 0, 0, false);
    }
  }
}
