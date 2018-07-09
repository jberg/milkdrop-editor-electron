import React from 'react';

export default class PresetPartSelector extends React.Component {
  constructor(props) {
    super(props);
  }

  onPresetPartSelect(e) {
    const presetPartSelected = e.target.value;
    if (presetPartSelected === 'preset') {
      this.props.updatePresetPartSelector({
        presetPartSelected,
        presetEquationsSelected: 'presetInit'
      });
    } else if (presetPartSelected === 'shapes') {
      this.props.updatePresetPartSelector({
        presetPartSelected,
        shapeSelected: 'shape1',
        shapeEquationsSelected: 'shapeInit'
      });
    } else if (presetPartSelected === 'waves') {
      this.props.updatePresetPartSelector({
        presetPartSelected,
        waveSelected: 'wave1',
        waveEquationsSelected: 'waveInit'
      });
    } else if (presetPartSelected === 'shaders') {
      this.props.updatePresetPartSelector({
        presetPartSelected,
        shaderSelected: 'warp'
      });
    }
  }

  onPresetEquationsSelect(e) {
    const presetEquationsSelected = e.target.value;
    this.props.updatePresetPartSelector({ presetEquationsSelected });
  }

  onShapeSelect(e) {
    const shapeSelected = e.target.value;
    this.props.updatePresetPartSelector({
      shapeSelected,
      shapeEquationsSelected: 'shapeInit'
    });
  }

  onShapeEquationsSelect(e) {
    const shapeEquationsSelected = e.target.value;
    this.props.updatePresetPartSelector({ shapeEquationsSelected });
  }

  onWaveSelect(e) {
    const waveSelected = e.target.value;
    this.props.updatePresetPartSelector({
      waveSelected,
      waveEquationsSelected: 'waveInit'
    });
  }

  onWaveEquationsSelect(e) {
    const waveEquationsSelected = e.target.value;
    this.props.updatePresetPartSelector({ waveEquationsSelected });
  }

  onShaderSelect(e) {
    const shaderSelected = e.target.value;
    this.props.updatePresetPartSelector({ shaderSelected });
  }

  render() {
    const {
      presetPartSelected,
      presetEquationsSelected,
      shapeSelected,
      shapeEquationsSelected,
      waveSelected,
      waveEquationsSelected,
      shaderSelected
    } = this.props;

    return (
      <div>
        <select
          value={presetPartSelected}
          onChange={e => this.onPresetPartSelect(e)}
        >
          <option value="preset">Preset Equations</option>
          <option value="shapes">Shapes</option>
          <option value="waves">Waves</option>
          <option value="shaders">Shaders</option>
        </select>
        <select
          value={presetEquationsSelected}
          onChange={e => this.onPresetEquationsSelect(e)}
          style={{
            display: presetPartSelected === 'preset' ? 'inline-block' : 'none'
          }}
        >
          <option value="presetInit">Init Equations</option>
          <option value="presetPerFrame">Per Frame Equations</option>
          <option value="presetPerPixel">Per Pixel Equations</option>
        </select>
        <select
          value={shapeSelected}
          onChange={e => this.onShapeSelect(e)}
          style={{
            display: presetPartSelected === 'shapes' ? 'inline-block' : 'none'
          }}
        >
          <option value="shape1">Shape 1</option>
          <option value="shape2">Shape 2</option>
          <option value="shape3">Shape 3</option>
          <option value="shape4">Shape 4</option>
        </select>
        <select
          value={shapeEquationsSelected}
          onChange={e => this.onShapeEquationsSelect(e)}
          style={{
            display: presetPartSelected === 'shapes' ? 'inline-block' : 'none'
          }}
        >
          <option value="shapeInit">Shape Init Equations</option>
          <option value="shapePerFrame">Shape Per Frame Equations</option>
        </select>
        <select
          value={waveSelected}
          onChange={e => this.onWaveSelect(e)}
          style={{
            display: presetPartSelected === 'waves' ? 'inline-block' : 'none'
          }}
        >
          <option value="wave1">Wave 1</option>
          <option value="wave2">Wave 2</option>
          <option value="wave3">Wave 3</option>
          <option value="wave4">Wave 4</option>
        </select>
        <select
          value={waveEquationsSelected}
          onChange={e => this.onWaveEquationsSelect(e)}
          style={{
            display: presetPartSelected === 'waves' ? 'inline-block' : 'none'
          }}
        >
          <option value="waveInit">Wave Init Equations</option>
          <option value="wavePerFrame">WavePer Frame Equations</option>
          <option value="wavePerPoint">Wave Per Point Equations</option>
        </select>
        <select
          value={shaderSelected}
          onChange={e => this.onShaderSelect(e)}
          style={{
            display: presetPartSelected === 'shaders' ? 'inline-block' : 'none'
          }}
        >
          <option value="shaderWarp">Warp Shader</option>
          <option value="shaderComp">Comp Shader</option>
        </select>
      </div>
    );
  }
}
