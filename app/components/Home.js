import React from 'react';
import _ from 'lodash';
import { ipcRenderer } from 'electron';
import butterchurn from 'butterchurn';
import butterchurnExtraImages from 'butterchurn/lib/butterchurnExtraImages.min';
import styles from './Home.css';

export default class Home extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      micConnected: false,
      presetCompiling: false,
      presetParts: null,
      editedPresetParts: null,
      presetPartSelected: 'preset',
      presetEquationsSelected: 'presetInit',
      shapeSelected: 'shape1',
      shapeEquationsSelected: 'shapeInit',
      waveSelected: 'wave1',
      waveEquationsSelected: 'waveInit',
      shaderSelected: 'warp'
    };

    // eslint-disable-next-line no-global-assign
    AudioContext = window.AudioContext =
      window.AudioContext || window.webkitAudioContext;
    this.audioContext = new AudioContext();
  }

  componentDidMount() {
    this.audioContext = new AudioContext();
    this.visualizer = butterchurn.createVisualizer(
      this.audioContext,
      this.canvasNode,
      {
        width: 800,
        height: 600,
        pixelRatio: window.devicePixelRatio || 1
      }
    );
    this.visualizer.loadExtraImages(butterchurnExtraImages.getImages());

    this.audioNode = this.audioContext.createGain();
    this.audioNode.gain.value = 1.25;
    this.visualizer.connectAudio(this.audioNode);

    const renderLoop = () => {
      this.visualizer.render();
      this.animationFrameRequest = window.requestAnimationFrame(renderLoop);
    };
    renderLoop();

    this.loadMicAudio();

    ipcRenderer.on('converted-preset', (e, convertedPreset, presetParts) => {
      this.visualizer.loadPreset(convertedPreset, 2.7);
      this.setState({
        presetParts,
        editedPresetParts: _.cloneDeep(presetParts),
        presetCompiling: false
      });
    });

    ipcRenderer.on('converted-preset-map', (e, convertedPreset) => {
      this.visualizer.loadPreset(convertedPreset, 0.0);
      this.setState({ presetCompiling: false });
    });
  }

  connectMicAudio(sourceNode) {
    sourceNode.connect(this.audioNode);
    this.setState({ micConnected: true });
  }

  loadMicAudio() {
    navigator.getUserMedia(
      { audio: true },
      stream => {
        const micSourceNode = this.audioContext.createMediaStreamSource(stream);
        this.connectMicAudio(micSourceNode);
      },
      () => {
        console.log('Error getting audio stream from getUserMedia');
      }
    );
  }

  loadPreset(e) {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      ipcRenderer.send('preset-data', reader.result);
      this.setState({ presetCompiling: true });
    };
    reader.readAsText(file);
  }

  recompilePreset() {
    const presetParts = this.state.editedPresetParts;
    ipcRenderer.send('preset-map', presetParts);
    this.setState({ presetParts, presetCompiling: true });
  }

  currentPresetPart() {
    const { presetPartSelected } = this.state;
    if (presetPartSelected === 'preset') {
      const { presetEquationsSelected } = this.state;
      if (presetEquationsSelected === 'presetInit') {
        return 'presetInit';
      } else if (presetEquationsSelected === 'presetPerFrame') {
        return 'perFrame';
      } else if (presetEquationsSelected === 'presetPerPixel') {
        return 'perVertex';
      }
    } else if (presetPartSelected === 'shapes') {
      const shapeNum = this.state.shapeSelected.slice(-1);
      const { shapeEquationsSelected } = this.state;
      let shapeEQ;
      if (shapeEquationsSelected === 'shapeInit') {
        shapeEQ = 'init_eqs_str';
      } else if (shapeEquationsSelected === 'shapePerFrame') {
        shapeEQ = 'frame_eqs_str';
      }

      return `shapes[${shapeNum}].${shapeEQ}`;
    } else if (presetPartSelected === 'waves') {
      const waveNum = this.state.waveSelected.slice(-1);
      const { waveEquationsSelected } = this.state;
      let waveEQ;
      if (waveEquationsSelected === 'waveInit') {
        waveEQ = 'init_eqs_str';
      } else if (waveEquationsSelected === 'wavePerFrame') {
        waveEQ = 'frame_eqs_str';
      } else if (waveEquationsSelected === 'wavePerPoint') {
        waveEQ = 'point_eqs_str';
      }

      return `waves[${waveNum}].${waveEQ}`;
    } else if (presetPartSelected === 'shaders') {
      const { shaderSelected } = this.state;
      if (shaderSelected === 'shaderWarp') {
        return 'warp';
      } else if (shaderSelected === 'shaderComp') {
        return 'comp';
      }
    }
  }

  onPresetPartSelect(e) {
    const presetPartSelected = e.target.value;
    if (presetPartSelected === 'preset') {
      this.setState({
        presetPartSelected,
        presetEquationsSelected: 'presetInit'
      });
    } else if (presetPartSelected === 'shapes') {
      this.setState({
        presetPartSelected,
        shapeSelected: 'shape1',
        shapeEquationsSelected: 'shapeInit'
      });
    } else if (presetPartSelected === 'waves') {
      this.setState({
        presetPartSelected,
        waveSelected: 'wave1',
        waveEquationsSelected: 'waveInit'
      });
    } else if (presetPartSelected === 'shaders') {
      this.setState({ presetPartSelected, shaderSelected: 'warp' });
    }
  }

  onPresetEquationsSelect(e) {
    const presetEquationsSelected = e.target.value;
    this.setState({ presetEquationsSelected });
  }

  onShapeSelect(e) {
    const shapeSelected = e.target.value;
    this.setState({ shapeSelected, shapeEquationsSelected: 'shapeInit' });
  }

  onShapeEquationsSelect(e) {
    const shapeEquationsSelected = e.target.value;
    this.setState({ shapeEquationsSelected });
  }

  onWaveSelect(e) {
    const waveSelected = e.target.value;
    this.setState({ waveSelected, waveEquationsSelected: 'waveInit' });
  }

  onWaveEquationsSelect(e) {
    const waveEquationsSelected = e.target.value;
    this.setState({ waveEquationsSelected });
  }

  onShaderSelect(e) {
    const shaderSelected = e.target.value;
    this.setState({ shaderSelected });
  }

  onPresetPartChange(e) {
    const editedPresetParts = _.set(
      this.state.editedPresetParts,
      this.currentPresetPart(),
      e.target.value
    );
    this.setState({ editedPresetParts });
  }

  render() {
    const presetText =
      _.get(this.state.editedPresetParts, this.currentPresetPart()) || '';

    return (
      <div>
        <div className={styles.container} data-tid="container">
          <div>
            <div onClick={() => this.presetInputNode.click()}>
              <span>Load local preset</span>
              <input
                type="file"
                ref={node => {
                  this.presetInputNode = node;
                }}
                onChange={e => this.loadPreset(e)}
                style={{ display: 'none' }}
              />
            </div>
          </div>
          <div style={{ display: this.state.micConnected ? 'none' : 'block' }}>
            <div onClick={() => this.loadMicAudio()}>
              <span>Use Mic</span>
            </div>
          </div>
          <div style={{ marginTop: '20px' }}>
            <div
              style={{
                display: this.state.presetParts ? 'inline-block' : 'none',
                verticalAlign: 'top',
                marginRight: '20px'
              }}
            >
              <div
                onClick={() => this.recompilePreset()}
                style={{
                  display: this.state.presetCompiling ? 'none' : 'block'
                }}
              >
                <span>Recompile preset</span>
              </div>
              <div>
                <select
                  value={this.state.presetPartSelected}
                  onChange={e => this.onPresetPartSelect(e)}
                >
                  <option value="preset">Preset Equations</option>
                  <option value="shapes">Shapes</option>
                  <option value="waves">Waves</option>
                  <option value="shaders">Shaders</option>
                </select>
                <select
                  value={this.state.presetEquationsSelected}
                  onChange={e => this.onPresetEquationsSelect(e)}
                  style={{
                    display:
                      this.state.presetPartSelected === 'preset'
                        ? 'inline-block'
                        : 'none'
                  }}
                >
                  <option value="presetInit">Init Equations</option>
                  <option value="presetPerFrame">Per Frame Equations</option>
                  <option value="presetPerPixel">Per Pixel Equations</option>
                </select>
                <select
                  value={this.state.shapeSelected}
                  onChange={e => this.onShapeSelect(e)}
                  style={{
                    display:
                      this.state.presetPartSelected === 'shapes'
                        ? 'inline-block'
                        : 'none'
                  }}
                >
                  <option value="shape1">Shape 1</option>
                  <option value="shape2">Shape 2</option>
                  <option value="shape3">Shape 3</option>
                  <option value="shape4">Shape 4</option>
                </select>
                <select
                  value={this.state.shapeEquationsSelected}
                  onChange={e => this.onShapeEquationsSelect(e)}
                  style={{
                    display:
                      this.state.presetPartSelected === 'shapes'
                        ? 'inline-block'
                        : 'none'
                  }}
                >
                  <option value="shapeInit">Shape Init Equations</option>
                  <option value="shapePerFrame">
                    Shape Per Frame Equations
                  </option>
                </select>
                <select
                  value={this.state.waveSelected}
                  onChange={e => this.onWaveSelect(e)}
                  style={{
                    display:
                      this.state.presetPartSelected === 'waves'
                        ? 'inline-block'
                        : 'none'
                  }}
                >
                  <option value="wave1">Wave 1</option>
                  <option value="wave2">Wave 2</option>
                  <option value="wave3">Wave 3</option>
                  <option value="wave4">Wave 4</option>
                </select>
                <select
                  value={this.state.waveEquationsSelected}
                  onChange={e => this.onWaveEquationsSelect(e)}
                  style={{
                    display:
                      this.state.presetPartSelected === 'waves'
                        ? 'inline-block'
                        : 'none'
                  }}
                >
                  <option value="waveInit">Wave Init Equations</option>
                  <option value="wavePerFrame">WavePer Frame Equations</option>
                  <option value="wavePerPoint">Wave Per Point Equations</option>
                </select>
                <select
                  value={this.state.shaderSelected}
                  onChange={e => this.onShaderSelect(e)}
                  style={{
                    display:
                      this.state.presetPartSelected === 'shaders'
                        ? 'inline-block'
                        : 'none'
                  }}
                >
                  <option value="shaderWarp">Warp Shader</option>
                  <option value="shaderComp">Comp Shader</option>
                </select>
              </div>
              <textarea
                value={presetText}
                onChange={e => this.onPresetPartChange(e)}
                style={{ width: '400px', height: '400px' }}
              />
            </div>
            <canvas
              width="800"
              height="600"
              ref={node => {
                this.canvasNode = node;
              }}
            />
          </div>
        </div>
      </div>
    );
  }
}
