import React from 'react';
import _ from 'lodash';
import { ipcRenderer } from 'electron';
import butterchurn from 'butterchurn';
import butterchurnExtraImages from 'butterchurn/lib/butterchurnExtraImages.min';
import styles from './Home.css';
import PresetPartSelector from './PresetPartSelector';

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
    const presetParts = _.cloneDeep(this.state.editedPresetParts);
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

  updatePresetPartSelector(m) {
    this.setState(m);
  }

  onPresetPartChange(e) {
    const editedPresetParts = _.set(
      this.state.editedPresetParts,
      this.currentPresetPart(),
      e.target.value
    );
    this.setState({ editedPresetParts });
  }

  onPresetDiscardChanges() {
    this.setState({ editedPresetParts: _.cloneDeep(this.state.presetParts) });
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
              <div
                onClick={() => this.onPresetDiscardChanges()}
                style={{
                  display: _.isEqual(
                    this.state.editedPresetParts,
                    this.state.presetParts
                  )
                    ? 'none'
                    : 'block'
                }}
              >
                <span>Discard changes</span>
              </div>
              <PresetPartSelector
                updatePresetPartSelector={m => this.updatePresetPartSelector(m)}
                presetPartSelected={this.state.presetPartSelected}
                presetEquationsSelected={this.state.presetEquationsSelected}
                shapeSelected={this.state.shapeSelected}
                shapeEquationsSelected={this.state.shapeEquationsSelected}
                waveSelected={this.state.waveSelected}
                waveEquationsSelected={this.state.waveEquationsSelected}
                shaderSelected={this.state.shaderSelected}
              />
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
