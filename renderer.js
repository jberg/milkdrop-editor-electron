const $ = require('jquery');
const _ = require('lodash');
const { ipcRenderer } = require('electron');
const butterchurn = require('butterchurn');
const butterchurnExtraImages = require('butterchurn/lib/butterchurnExtraImages.min.js');

var visualizer = null;
var rendering = false;
var audioContext = null;
var sourceNode = null;
var delayedAudible = null;
var currentPresetParts = {};
var canvas = document.getElementById('canvas');

function connectToAudioAnalyzer(sourceNode) {
  if(delayedAudible) {
    delayedAudible.disconnect();
  }

  delayedAudible = audioContext.createDelay();
  delayedAudible.delayTime.value = 0.26;

  sourceNode.connect(delayedAudible)
  delayedAudible.connect(audioContext.destination);

  visualizer.connectAudio(delayedAudible);
}

function startRenderer() {
  requestAnimationFrame(() => startRenderer());
  visualizer.render();
}

function playBufferSource(buffer) {
  if (!rendering) {
    rendering = true;
    startRenderer();
  }

  if (sourceNode) {
    sourceNode.disconnect();
  }

  sourceNode = audioContext.createBufferSource();
  sourceNode.buffer = buffer;
  connectToAudioAnalyzer(sourceNode);

  sourceNode.start(0);
}

function loadLocalFiles(files, index = 0) {
  audioContext.resume();

  var reader = new FileReader();
  reader.onload = (event) => {
    audioContext.decodeAudioData(
      event.target.result,
      (buf) => {
        playBufferSource(buf);

        setTimeout(() => {
          if (files.length > index + 1) {
            loadLocalFiles(files, index + 1);
          } else {
            sourceNode.disconnect();
            sourceNode = null;
            $("#audioSelectWrapper").css('display', 'block');
          }
        }, buf.duration * 1000);
      }
    );
  };

  var file = files[index];
  reader.readAsArrayBuffer(file);
}

function connectMicAudio(sourceNode, audioContext) {
  audioContext.resume();

  var gainNode = audioContext.createGain();
  gainNode.gain.value = 1.25;
  sourceNode.connect(gainNode);

  visualizer.connectAudio(gainNode);
  startRenderer();
}

$("#localPresetBut").click(() => {
  const fileSelector = $('<input type="file" />');

  fileSelector[0].onchange = (event) => {
    const file = fileSelector[0].files[0];
    const reader = new FileReader();
    reader.onload = (e2) => {
      ipcRenderer.send('preset-data', reader.result);
    }
    reader.readAsText(file);
  }

  fileSelector.click();
});

$("#localFileBut").click(function() {
  $("#audioSelectWrapper").css('display', 'none');

  var fileSelector = $('<input type="file" accept="audio/*" multiple />');

  fileSelector[0].onchange = function(event) {
    loadLocalFiles(fileSelector[0].files);
  }

  fileSelector.click();
});

$("#micSelect").click(() => {
  $("#audioSelectWrapper").css('display', 'none');

  navigator.getUserMedia({ audio: true }, (stream) => {
    var micSourceNode = audioContext.createMediaStreamSource(stream);
    connectMicAudio(micSourceNode, audioContext);
  }, (err) => {
    console.log('Error getting audio stream from getUserMedia');
  });
});

function hideAllSelect () {
  $("#presetEquationsSelect").hide();
  $("#shapeSelect").hide();
  $("#shapeEquationsSelect").hide();
  $("#waveSelect").hide();
  $("#waveEquationsSelect").hide();
  $("#shadersSelect").hide();
}

$("#presetPartSelect").change(function (evt) {
  hideAllSelect();

  if (this.value === 'preset') {
    $("#presetEquationsSelect").val('presetInit').trigger('change').show();
  } else if (this.value === 'shapes') {
    $("#shapeSelect").val('shape1').show().trigger('change');
  } else if (this.value === 'waves') {
    $("#waveSelect").val('wave1').show().trigger('change');
  } else if (this.value === 'shaders') {
    $("#shadersSelect").val('shaderWarp').trigger('change').show();
  }
});

$("#presetEquationsSelect").change(function (evt) {
  if (this.value === "presetInit") {
    $("#editor").val(_.get(currentPresetParts, 'presetInit', ''));
  } else if (this.value === "presetPerFrame") {
    $("#editor").val(_.get(currentPresetParts, 'perFrame', ''));
  } else if (this.value === "presetPerPixel") {
    $("#editor").val(_.get(currentPresetParts, 'perVertex', ''));
  }
});

function getSelectedShape () {
  const shapeSelected = $("#shapeSelect").val();
  let shapeNum;
  if (shapeSelected === "shape1") {
    shapeNum = 0;
  } else if (shapeSelected === "shape2") {
    shapeNum = 1;
  } else if (shapeSelected === "shape3") {
    shapeNum = 2;
  } else if (shapeSelected === "shape4") {
    shapeNum = 3;
  }

  return shapeNum;
}

function getSelectedShapeEQ () {
  const shapeEQSelected = $("#shapeEquationsSelect").val();
  let shapeEQ;
  if (shapeEQSelected === "shapeInit") {
    shapeEQ = 'init_eqs_str';
  } else if (shapeEQSelected === "shapePerFrame") {
    shapeEQ = 'frame_eqs_str';
  }

  return shapeEQ;
}

$("#shapeSelect").change(function (evt) {
  $("#shapeEquationsSelect").val('shapeInit').trigger('change').show();
});

$("#shapeEquationsSelect").change(function (evt) {
  const shapeNum = getSelectedShape();
  const shapeEQ = getSelectedShapeEQ();
  $("#editor").val(_.get(currentPresetParts, `shapes[${shapeNum}].${shapeEQ}`, ''));
});

function getSelectedWave () {
  const waveSelected = $("#waveSelect").val();
  let waveNum;
  if (waveSelected === "wave1") {
    waveNum = 0;
  } else if (waveSelected === "wave2") {
    waveNum = 1;
  } else if (waveSelected === "wave3") {
    waveNum = 2;
  } else if (waveSelected === "wave4") {
    waveNum = 3;
  }

  return waveNum;
}

function getSelectedWaveEQ () {
  const waveEQSelected = $("#waveEquationsSelect").val();
  let waveEQ;
  if (waveEQSelected === "waveInit") {
    waveEQ = 'init_eqs_str';
  } else if (waveEQSelected === "wavePerFrame") {
    waveEQ = 'frame_eqs_str';
  } else if (waveEQSelected === "wavePerPoint") {
    waveEQ = 'point_eqs_str';
  }

  return waveEQ;
}

$("#waveSelect").change(function (evt) {
  $("#waveEquationsSelect").val('waveInit').trigger('change').show();
});

$("#waveEquationsSelect").change(function (evt) {
  const waveNum = getSelectedWave();
  const waveEQ = getSelectedWaveEQ();
  $("#editor").val(_.get(currentPresetParts, `waves[${waveNum}].${waveEQ}`, ''));
});

$("#shadersSelect").change(function (evt) {
  if (this.value === 'shaderWarp') {
    $("#editor").val(currentPresetParts.warp);
  } else if (this.value === 'shaderComp') {
    $("#editor").val(currentPresetParts.comp);
  }
});

$("#compilePresetBut").click(() => {
  const editorText = $("#editor").val();
  const presetPartSelected = $("#presetPartSelect").val();
  if (presetPartSelected === 'preset') {
    const presetEQSelected = $("#presetEquationsSelect").val();
    if (presetEQSelected === "presetInit") {
      currentPresetParts.presetInit = editorText;
    } else if (presetEQSelected === "presetPerFrame") {
      currentPresetParts.perFrame = editorText;
    } else if (presetEQSelected === "presetPerPixel") {
      currentPresetParts.perVertex = editorText;
    }
  } else if (presetPartSelected === 'shapes') {
    const shapeNum = getSelectedShape();
    const shapeEQ = getSelectedShapeEQ();

    _.set(currentPresetParts, `shapes[${shapeNum}].${shapeEQ}`, editorText);
  } else if (presetPartSelected === 'waves') {
    const waveNum = getSelectedWave();
    const waveEQ = getSelectedWaveEQ();

    _.set(currentPresetParts, `waves[${waveNum}].${waveEQ}`, editorText);
  } else if (presetPartSelected === 'shaders') {
    const shaderSelected = $("#shadersSelect").val();
    if (shaderSelected === 'shaderWarp') {
      currentPresetParts.warp = editorText;
    } else if (shaderSelected === 'shaderComp') {
      currentPresetParts.comp = editorText;
    }
  }

  ipcRenderer.send('preset-map', currentPresetParts);
});

function initPlayer() {
  AudioContext = window.AudioContext = (window.AudioContext || window.webkitAudioContext);
  audioContext = new AudioContext();

  visualizer = butterchurn.createVisualizer(audioContext, canvas , {
    width: 800,
    height: 600,
    mesh_width: 64,
    mesh_height: 48,
    pixelRatio: window.devicePixelRatio || 1,
    textureRatio: 1,
  });
  visualizer.loadExtraImages(butterchurnExtraImages.getImages());
}

ipcRenderer.on('converted-preset', (event, convertedPreset, presetParts) => {
  currentPresetParts = presetParts;
  hideAllSelect();
  $("#presetPartSelect").val('preset').trigger('change').show();
  visualizer.loadPreset(convertedPreset, 2.7);
});

ipcRenderer.on('converted-preset-map', (event, convertedPreset) => {
  visualizer.loadPreset(convertedPreset, 0.0);
});

initPlayer();
