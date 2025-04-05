import Phaser from "phaser";

const fragShader = `
precision mediump float;

uniform sampler2D uMainSampler;
uniform vec2 uTextureSize;
uniform vec4 uOutlineColor; 
uniform float uThickness;  
uniform float uThreshold;    

uniform bool uSonarActive;
uniform vec2 uSonarCenter; 
uniform float uSonarRadius;   
uniform vec2 uScreenSize;     

varying vec2 outTexCoord;     

void main() {
    vec4 final_color = vec4(0.0);

    if (!uSonarActive) {
        gl_FragColor = final_color;
        return;
    }

    vec2 screen_pos = outTexCoord * uScreenSize;

    float dist_to_sonar = distance(screen_pos, uSonarCenter);

    if (dist_to_sonar <= uSonarRadius) {
        float current_alpha = texture2D(uMainSampler, outTexCoord).a;
        vec2 onePixel = vec2(1.0 / uTextureSize.x, 1.0 / uTextureSize.y);

        if (current_alpha < uThreshold) {
            float max_neighbor_alpha = 0.0;
            vec2 offset = onePixel * uThickness;

            max_neighbor_alpha = max(max_neighbor_alpha, texture2D(uMainSampler, outTexCoord + vec2(0.0, offset.y)).a);
            max_neighbor_alpha = max(max_neighbor_alpha, texture2D(uMainSampler, outTexCoord - vec2(0.0, offset.y)).a);
            max_neighbor_alpha = max(max_neighbor_alpha, texture2D(uMainSampler, outTexCoord + vec2(offset.x, 0.0)).a);
            max_neighbor_alpha = max(max_neighbor_alpha, texture2D(uMainSampler, outTexCoord - vec2(offset.x, 0.0)).a);
            max_neighbor_alpha = max(max_neighbor_alpha, texture2D(uMainSampler, outTexCoord + vec2(offset.x, offset.y)).a);
            max_neighbor_alpha = max(max_neighbor_alpha, texture2D(uMainSampler, outTexCoord - vec2(offset.x, offset.y)).a);
            max_neighbor_alpha = max(max_neighbor_alpha, texture2D(uMainSampler, outTexCoord + vec2(-offset.x, offset.y)).a);
            max_neighbor_alpha = max(max_neighbor_alpha, texture2D(uMainSampler, outTexCoord + vec2(offset.x, -offset.y)).a);


            if (max_neighbor_alpha >= uThreshold) {
                final_color = uOutlineColor;
            }
        }
    }

    gl_FragColor = final_color;
}
`;

export default class OutlinePipeline extends Phaser.Renderer.WebGL.Pipelines
  .PreFXPipeline {
  private _outlineColor: Phaser.Display.Color;
  private _thickness: number;
  private _threshold: number;
  private _textureWidth: number;
  private _textureHeight: number;

  private _sonarActive: boolean;
  private _sonarCenter: Phaser.Math.Vector2;
  private _sonarRadius: number;
  private _screenSize: Phaser.Math.Vector2;

  static KEY: string = "OutlinePipeline";

  constructor(game: Phaser.Game) {
    super({
      game: game,
      fragShader: fragShader,
    });

    this._outlineColor = new Phaser.Display.Color(0, 255, 0, 255);
    this._thickness = 2.0;
    this._threshold = 0.1;
    this._textureWidth = 1080;
    this._textureHeight = 1350;

    this._sonarActive = false;
    this._sonarCenter = new Phaser.Math.Vector2(0, 0);
    this._sonarRadius = 0;
    this._screenSize = new Phaser.Math.Vector2(
      game.scale.width || 0,
      game.scale.height || 0
    );
  }

  onPreRender() {
    this._screenSize.set(this.game.scale.width, this.game.scale.height);

    this.set4f(
      "uOutlineColor",
      this._outlineColor.redGL,
      this._outlineColor.greenGL,
      this._outlineColor.blueGL,
      this._outlineColor.alphaGL
    );
    this.set1f("uThickness", this._thickness);
    this.set1f("uThreshold", this._threshold);
    this.set2f("uTextureSize", this._textureWidth, this._textureHeight);

    this.set1i("uSonarActive", this._sonarActive ? 1 : 0);
    this.set2f("uSonarCenter", this._sonarCenter.x, this._sonarCenter.y);
    this.set1f("uSonarRadius", this._sonarRadius);
    this.set2f("uScreenSize", this._screenSize.x, this._screenSize.y);
  }

  public setTextureSize(width: number, height: number) {
    this._textureWidth = width;
    this._textureHeight = height;
  }

  public setOutlineColor(color: number, alpha = 1) {
    const colorToRgb = Phaser.Display.Color.IntegerToRGB(color);
    this._outlineColor.setTo(
      colorToRgb.r,
      colorToRgb.g,
      colorToRgb.b,
      alpha * 255
    );
    return this;
  }

  public setThickness(thickness: number) {
    this._thickness = Math.max(1.0, thickness);
    return this;
  }

  public setThreshold(threshold: number) {
    this._threshold = Phaser.Math.Clamp(threshold, 0.0, 1.0);
    return this;
  }

  public setSonarProperties(
    x: number,
    y: number,
    radius: number,
    active: boolean
  ) {
    this._sonarCenter.set(x, y);
    this._sonarRadius = radius;
    this._sonarActive = active;
  }

  get outlineColor() {
    return this._outlineColor;
  }
  get thickness() {
    return this._thickness;
  }
  get threshold() {
    return this._threshold;
  }
}
