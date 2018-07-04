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

var mainWrapper = document.getElementById('mainWrapper');
mainWrapper.addEventListener('dragover', (e) => {
  e.stopPropagation();
  e.preventDefault();
  e.dataTransfer.dropEffect = 'copy';
});

// Get file data on drop
mainWrapper.addEventListener('drop', (e) => {
  e.stopPropagation();
  e.preventDefault();

  var files = e.dataTransfer.files;
  for (var i = 0; i < files.length; i++) {
    var file = files[i];
    if (file.name.match(/\.milk/)) {
      var reader = new FileReader();
      reader.onload = (e2) => {
        ipcRenderer.send('preset-data', reader.result);
      }

      reader.readAsText(file);
    }
  }
});

ipcRenderer.on('converted-preset', (event, preset) => {
  visualizer.loadPreset(preset, 2.7);
});

initPlayer();
