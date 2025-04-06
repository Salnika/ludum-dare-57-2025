import outlinePipelineInstanceBackground from "../shaders/outline";
import GameScene from "./GameScene";

export default class PipelineManager {
  private outlinePipelineInstanceBackground: outlinePipelineInstanceBackground | null =
    null;

  constructor(private scene: GameScene) {}

  getOutlinePipeline(): outlinePipelineInstanceBackground | null {
    return this.outlinePipelineInstanceBackground;
  }

  registerAndConfigureOutlinePipeline(): void {
    const renderer = this.scene.game.renderer;

    if (renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer) {
      if (renderer.isContextLost) {
        console.error("WebGL context lost!");
        return;
      }
      if (this.outlinePipelineInstanceBackground) {
        renderer.pipelines.remove(outlinePipelineInstanceBackground.KEY);
        this.outlinePipelineInstanceBackground.destroy();
      }

      this.outlinePipelineInstanceBackground =
        new outlinePipelineInstanceBackground(this.scene.game);

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

  destroy(): void {
    const renderer = this.scene.game.renderer;
    if (
      this.outlinePipelineInstanceBackground &&
      renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer
    ) {
      renderer.pipelines.remove(outlinePipelineInstanceBackground.KEY);
      this.outlinePipelineInstanceBackground.destroy();
      this.outlinePipelineInstanceBackground = null;
    }
  }
}
