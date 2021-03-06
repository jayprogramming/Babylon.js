import * as React from "react";
import { BaseTexture, PostProcess, Texture } from "babylonjs";

interface ITextureLineComponentProps {
    texture: BaseTexture,
    width: number,
    height: number
}

export class TextureLineComponent extends React.Component<ITextureLineComponentProps, { displayRed: boolean, displayGreen: boolean, displayBlue: boolean, displayAlpha: boolean, face: number }> {
    constructor(props: ITextureLineComponentProps) {
        super(props);

        this.state = {
            displayRed: true,
            displayGreen: true,
            displayBlue: true,
            displayAlpha: true,
            face: 0
        }
    }

    shouldComponentUpdate(nextProps: ITextureLineComponentProps): boolean {
        return (nextProps.texture !== this.props.texture);
    }

    componentDidMount() {
        this.updatePreview();
    }

    componentDidUpdate() {
        this.updatePreview();
    }

    updatePreview() {
        var texture = this.props.texture;
        var scene = texture.getScene()!;
        var engine = scene.getEngine();
        var size = texture.getSize();
        var ratio = size.width / size.height
        var width = this.props.width;
        var height = (width / ratio) | 0;

        let passPostProcess: PostProcess;

        if (!texture.isCube) {
            passPostProcess = new BABYLON.PassPostProcess("pass", 1, null, BABYLON.Texture.NEAREST_SAMPLINGMODE, engine, false, BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT);
        } else {
            var passCubePostProcess = new BABYLON.PassCubePostProcess("pass", 1, null, BABYLON.Texture.NEAREST_SAMPLINGMODE, engine, false, BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT);
            passCubePostProcess.face = this.state.face;

            passPostProcess = passCubePostProcess;
        }

        if (!passPostProcess.getEffect().isReady()) {
            // Try again later
            passPostProcess.dispose();

            setTimeout(() => this.updatePreview(), 250);

            return;
        }

        const previewCanvas = this.refs.canvas as HTMLCanvasElement;

        let rtt = new BABYLON.RenderTargetTexture(
            "temp",
            { width: width, height: height },
            scene, false);

        passPostProcess.onApply = function(effect) {
            effect.setTexture("textureSampler", texture);
        };

        let internalTexture = rtt.getInternalTexture();

        if (internalTexture) {
            scene.postProcessManager.directRender([passPostProcess], internalTexture);

            // Read the contents of the framebuffer
            var numberOfChannelsByLine = width * 4;
            var halfHeight = height / 2;

            //Reading datas from WebGL
            var data = engine.readPixels(0, 0, width, height);

            if (!texture.isCube) {
                if (!this.state.displayRed || !this.state.displayGreen || !this.state.displayBlue) {
                    for (var i = 0; i < width * height * 4; i += 4) {

                        if (!this.state.displayRed) {
                            data[i] = 0;
                        }

                        if (!this.state.displayGreen) {
                            data[i + 1] = 0;
                        }

                        if (!this.state.displayBlue) {
                            data[i + 2] = 0;
                        }

                        if (this.state.displayAlpha) {
                            var alpha = data[i + 2];
                            data[i] = alpha;
                            data[i + 1] = alpha;
                            data[i + 2] = alpha;
                            data[i + 2] = 0;
                        }
                    }
                }
            }

            //To flip image on Y axis.
            if ((texture as Texture).invertY || texture.isCube) {
                for (var i = 0; i < halfHeight; i++) {
                    for (var j = 0; j < numberOfChannelsByLine; j++) {
                        var currentCell = j + i * numberOfChannelsByLine;
                        var targetLine = height - i - 1;
                        var targetCell = j + targetLine * numberOfChannelsByLine;

                        var temp = data[currentCell];
                        data[currentCell] = data[targetCell];
                        data[targetCell] = temp;
                    }
                }
            }

            previewCanvas.width = width;
            previewCanvas.height = height;
            var context = previewCanvas.getContext('2d');

            if (context) {
                // Copy the pixels to the preview canvas
                var imageData = context.createImageData(width, height);
                var castData = imageData.data;
                castData.set(data);
                context.putImageData(imageData, 0, 0);
            }

            // Unbind
            engine.unBindFramebuffer(internalTexture);
        }

        rtt.dispose();
        passPostProcess.dispose();

        previewCanvas.style.height = height + "px";
    }

    render() {
        var texture = this.props.texture;

        return (
            <div className="textureLine">
                {
                    texture.isCube &&
                    <div className="control3D">
                        <button className={this.state.face === 0 ? "px command selected" : "px command"} onClick={() => this.setState({ face: 0 })}>PX</button>
                        <button className={this.state.face === 1 ? "nx command selected" : "nx command"} onClick={() => this.setState({ face: 1 })}>NX</button>
                        <button className={this.state.face === 2 ? "py command selected" : "py command"} onClick={() => this.setState({ face: 2 })}>PY</button>
                        <button className={this.state.face === 3 ? "ny command selected" : "ny command"} onClick={() => this.setState({ face: 3 })}>NY</button>
                        <button className={this.state.face === 4 ? "pz command selected" : "pz command"} onClick={() => this.setState({ face: 4 })}>PZ</button>
                        <button className={this.state.face === 5 ? "nz command selected" : "nz command"} onClick={() => this.setState({ face: 5 })}>NZ</button>
                    </div>
                }
                {
                    !texture.isCube &&
                    <div className="control">
                        <button className={this.state.displayRed && !this.state.displayGreen ? "red command selected" : "red command"} onClick={() => this.setState({ displayRed: true, displayGreen: false, displayBlue: false, displayAlpha: false })}>R</button>
                        <button className={this.state.displayGreen && !this.state.displayBlue ? "green command selected" : "green command"} onClick={() => this.setState({ displayRed: false, displayGreen: true, displayBlue: false, displayAlpha: false })}>G</button>
                        <button className={this.state.displayBlue && !this.state.displayAlpha ? "blue command selected" : "blue command"} onClick={() => this.setState({ displayRed: false, displayGreen: false, displayBlue: true, displayAlpha: false })}>B</button>
                        <button className={this.state.displayAlpha && !this.state.displayRed ? "alpha command selected" : "alpha command"} onClick={() => this.setState({ displayRed: false, displayGreen: false, displayBlue: false, displayAlpha: true })}>A</button>
                        <button className={this.state.displayRed && this.state.displayGreen ? "all command selected" : "all command"} onClick={() => this.setState({ displayRed: true, displayGreen: true, displayBlue: true, displayAlpha: true })}>ALL</button>
                    </div>
                }
                <canvas ref="canvas" className="preview" />
            </div>
        );
    }
}
