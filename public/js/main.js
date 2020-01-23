import { buildTitles } from './titles.js';
import { audioTracks } from './tracks.js';


// google oauth client id: 979387771633-6sq071rlbc9u53fkam01ap82fj4v0rfj.apps.googleusercontent.com
// google oauth client secret: nsr-pOlAJ4XNvFIUTOCFCJsG

// function start() {
//   // Initializes the client with the API key and the Translate API.
//   gapi.client.init({
//     'apiKey': 'AIzaSyCvV0RM0aIpXIWgP7luE6C6-2rydq0iSoU',
//     'discoveryDocs': ['https://www.googleapis.com/youtube/v3/liveBroadcasts'],
//   }).then(function() {
//     // Executes an API request, and returns a Promise.
//     // The method name `language.translations.list` comes from the API discovery.
//     return gapi.client.language.translations.list({
//       q: 'hello world',
//       source: 'en',
//       target: 'de',
//     });
//   }).then(function(response) {
//     console.log(response.result.data.translations[0].translatedText);
//   }, function(reason) {
//     console.log('Error: ' + reason.result.error.message);
//   });
// };

// Loads the JavaScript client library and invokes `start` afterwards.
gapi.load('client', start);

let gameState = {
  player1: {
    score: 0
  },
  player2: {
    score: 0
  }
};
(_ => {
  try {
    const [player1, player2, game] = location.pathname.slice(1).split("/");
    gameState.player1.name = player1;
    gameState.player2.name = player2;
    gameState.gameTitle = game;
    gameState.player1.avatar = new Image();
    gameState.player2.avatar = new Image();
    gameState.player1.avatar.src = `/images/avatars/${player1}.png`;
    gameState.player2.avatar.src = `/images/avatars/${player2}.png`;
  } catch (error) {
    console.log(error);
  }
})();
const canvas = document.getElementById('canvas');
gameState.canvas = canvas;
canvas.width = 1920;
canvas.height = 1080;
const context = canvas.getContext('2d');
const color1 = '#fff', color2 = "#8F8";

const backgroundImage = new Image();
backgroundImage.onload = drawLoad;
backgroundImage.src = "/images/duckball-vs-cover.jpg";
const keyActions = {
  r: function() {
    startFeed();
  },
  t: function() {
    drawImage();
  },
  f: function() {
    let closingScreen;
    if(gameState.recorder)
      if(gameState.recorder.state !== "inactive") {
        gameState.status = 'final';
        setTimeout(_ => {
          gameState.status = 'ended';
          gameState.recorder.stop();
          delete gameState.audio;
          delete gameState.video;
          delete gameState.stream;
        }, 3000);
      }
  },
  1: function() {
    gameState.player1.score += 1;
    drawScore("player1");
  },
  2: function() {
    gameState.player2.score += 1;
    drawScore("player2");
  },
  "s": function() {
    const player1 = prompt("Enter Player 1 Name");
    const player2 = prompt("Enter Player 2 Name");
    const gameTitle = prompt("Enter Game Name");
    location.pathname = `/${player1}/${player2}/${gameTitle.replace(/\s/g, "+")}`;
  },
  "S": function() {
    gameState.switch = !gameState.switch;
    if(!gameState.feed) drawImage();
  },
  "P": function() {
    let paths = location.pathname.split('/');
    paths.splice(2,0,paths.splice(1,1)[0]);
    location.pathname = paths.join("/");
  },
  "!": function() {
    if(gameState.player1.score === 0) return;
    gameState.player1.score -= 1;
    drawScore("player1");
  },
  "@": function() {
    if(gameState.player2.score === 0) return;
    gameState.player2.score -= 1;
    drawScore("player2");
  }
}
function fullClear() {
  context.clearRect(0,0,1920,1080);
}
function drawScore(player) {
  context.font = "700 160px Teko";
  context.textBaseline = "baseline";
  const fillColor = gameState.switch ? (player === "player1" ? color1 : color2) : (player === "player1" ? color2 : color1)
  context.fillStyle = fillColor;
  context.textAlign = player === "player1" ? "left" : "right";
  context.fillText(gameState[player].score, player === "player1" ? 16 : gameState.canvas.width-16, gameState.canvas.height-32);
  context.lineWidth = 5;
  context.strokeStyle = '#333';
  context.strokeText(gameState[player].score, player === "player1" ? 16 : gameState.canvas.width-16, gameState.canvas.height-32);
}
function drawLoad() {
  context.textBaseline = "middle";
  context.fillStyle = "#fff";
  context.textAlign = "center";
  context.font = "700 80px Teko";
  if((gameState.player1 || {}).name)
    context.fillText(
      `player1: ${gameState.player1.name}, player2: ${gameState.player2.name}, game title: ${gameState.gameTitle.replace(/\+/g, " ")}`, 
      gameState.canvas.width/2, 
      gameState.canvas.height/2 - 280,
      1920 * .9);
  context.font = "700 100px Teko";
  context.fillText(
    `enter players and game title: s`, 
    gameState.canvas.width/2, 
    gameState.canvas.height/2 - 140);
  context.fillText(
    `game title screen: t`, 
    gameState.canvas.width/2, 
    gameState.canvas.height/2);
  context.fillText(
    `start recording: r`, 
    gameState.canvas.width/2, 
    gameState.canvas.height/2 + 140);
}
async function audioReady(audio = gameState.audio) {
  return new Promise((resolve, reject) => {
    const readyInterval = setInterval(_ => {
      if(audio.captureStream().active) {
        clearInterval(readyInterval);
        return resolve();
      }
      return;
    }, 50);
  })
}
async function drawImage() {
  if(!document.fullscreenEnabled)
    await document.body.requestFullscreen();
  requestAnimationFrame(_ => {
    fullClear();
    const height = 1080, width = 1920;
    
    gameState.width = width;
    gameState.height = height;
    context.drawImage(backgroundImage, 0,0 , gameState.width, gameState.height);
    const xLeftCentered = 149+(643-149)/2;
    const xRightCentered = 1256+(1748-1256)/2;
    const player1Avatar = {
      dx: xLeftCentered - 540 / 2,
      dy: 1080/2 - 540 / 2,
      dWidth: 540,
      dHeight: 540
    };
    const player2Avatar = {
      dx: xRightCentered - 540 / 2,
      dy: 1080/2 - 540 / 2,
      dWidth: 540,
      dHeight: 540
    };
    context.drawImage(
      gameState.player1.avatar, 
      player1Avatar.dx, 
      player1Avatar.dy, 
      player1Avatar.dWidth, 
      player1Avatar.dHeight
    );
    context.drawImage(
      gameState.player2.avatar, 
      player2Avatar.dx, 
      player2Avatar.dy, 
      player2Avatar.dWidth, 
      player2Avatar.dHeight
    );
    const grdLeft = context.createLinearGradient(1920/2, 0, 0, 0);
    const grdRight = context.createLinearGradient(1920/2, 0, 1920, 0);
    grdLeft.addColorStop(0, "#088ea9");
    grdLeft.addColorStop(1, "#204e5d");
    grdRight.addColorStop(0, "#088ea9");
    grdRight.addColorStop(1, "#204e5d");
    context.fillStyle = grdLeft;
    context.fillRect(149, 782, 643-149, 927-782);
    context.fillStyle = grdRight;
    context.fillRect(1256, 782, 1748 - 1256, 927 - 782);

    context.fillStyle = gameState.switch ? color1 : color2;
    context.fillRect(149, 927, 643-149, 20);
    context.fillStyle = gameState.switch ? color2 : color1;
    context.fillRect(1256, 927, 1748 - 1256, 20);

    context.font = "700 80px Teko";
    context.fillStyle = '#fff';
    context.textAlign = "center";
    context.textBaseline = "middle";
    const nameBoxWidth = 450;
    context.fillText(gameState.player1.name.toUpperCase(), xLeftCentered, 845, nameBoxWidth);
    context.fillText(gameState.player2.name.toUpperCase(), xRightCentered, 845, nameBoxWidth);
    context.font = "600 40px Teko"
    context.fillText(`"${(titles[gameState.player1.name] || gameState.player1.name).toUpperCase()}"`, xLeftCentered, 885, nameBoxWidth);
    context.fillText(`"${(titles[gameState.player2.name] || gameState.player2.name).toUpperCase()}"`, xRightCentered, 885, nameBoxWidth);
    context.font = "700 100px Teko"
    context.fillText(gameState.gameTitle.toUpperCase().replace(/\+/g," "), 960, 85, 1920/2);

    if(gameState.status === 'final') {
      context.lineWidth = 5;
      context.strokeStyle = '#333';
      context.fillText("FINAL SCORE", 960, 590, 1920/4);
      context.strokeText("FINAL SCORE", 960, 590, 1920/4);
      context.fillStyle = gameState.switch ? color1 : color2;
      context.fillText(gameState.player1.score, 860, 700, 1920/4);
      context.strokeText(gameState.player1.score, 860, 700, 1920/4);
      context.fillStyle = gameState.switch ? color2 : color1;
      context.fillText(gameState.player2.score, 1060, 700, 1920/4);
      context.strokeText(gameState.player2.score, 1060, 700, 1920/4);
      
    }
  });
}
function startFeed() {
  if(gameState.feed) return;
  gameState.feed = true;
  record();
}
function stopFeed() {
  if(!gameState.feed) return;
  gameState.feed = false;
}
async function record() {
  if(!gameState.feed) return;
  if(!gameState.audio) {
    gameState.audio = document.createElement('audio');
    gameState.audio.addEventListener('ended', async (event) => {
      gameState.audio.src = `/audio/${selectTrack()}`;
      gameState.audio.play();
    })
    gameState.audio.src = `/audio/${selectTrack()}`;
    gameState.audio.play();
  }
  let aCtx = new AudioContext();
  let dest = aCtx.createMediaStreamDestination();
  let source = aCtx.createMediaElementSource(gameState.audio);
  source.connect(dest);
  source.connect(aCtx.destination);
  let audioTrack = dest.stream.getAudioTracks()[0];
  // await audioReady(gameState.audio);
  gameState.stream = new MediaStream([...gameState.canvas.captureStream(60).getVideoTracks(), ...dest.stream.getAudioTracks()]);

  gameState.recordedBlobs = [];
  gameState.recorder = new MediaRecorder(gameState.stream);
  gameState.recorder.onstop = recorderStop;
  gameState.recorder.ondataavailable = dataAvailable;
  gameState.recorder.start();
  gameState.status = "title";
  requestAnimationFrame(drawGame);
  setTimeout(((_) => gameState.status = 'video'), 3000);
  if(!gameState.video) {
    gameState.video = document.createElement('video');
    gameState.video.width = 1920;
    gameState.video.height = 1080;
  }
  try {
    const stream = await getStream()
    gameState.video.srcObject = stream;
    gameState.video.play();
  } catch(error) {
    gameState.status = "ended";
    alert(error.message);
  }
}
function drawGame() {
  switch(gameState.status) {
    case "title":
      drawImage();
      break;
    case "video":
      context.drawImage(gameState.video, 0,0,canvas.width,canvas.height);
      drawScore('player1');
      drawScore('player2');
      break;
    case "final":
      drawImage();
      break;
  }
  if(gameState.status != 'ended')
    requestAnimationFrame(drawGame);
}
function selectTrack() {
  return audioTracks.splice(Math.floor(Math.random()*audioTracks.length), 1)[0];
}
function recorderStop(event) {
  console.log('stopped recorder');
  let videoBlob = new Blob(gameState.recordedBlobs, {type: 'video/webm'});
  const videoURL = URL.createObjectURL(videoBlob);
  const download = document.createElement('a');
  download.href = videoURL;
  const date = new Date();
  download.download = `${date.getFullYear()}-${`00${date.getMonth()+1}`.slice(-2)}-${`00${date.getDate()}`.slice(-2)}-${gameState.player1.name}-vs-${gameState.player2.name}-${gameState.gameTitle}.mp4`;
  download.style.position = 'fixed';
  download.style.left = '-100px';
  download.style.top = '0';
  document.body.appendChild(download);
  download.click();
  document.body.removeChild(download);
}
function dataAvailable(event) {
  if (event.data && event.data.size > 0) {
    gameState.recordedBlobs.push(event.data);
  }
}
async function getStream() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    console.log("enumerateDevices() not supported.");
    return;
  }
  let devices = await navigator.mediaDevices.enumerateDevices()
  let cameraid;
  devices.forEach(function(device) {
    if (device.label.indexOf('back') > -1)
      cameraid = device.deviceId;
  });
  const constraints = {
    audio: false,
    video: {
      width: { min: 1280, ideal: 1920 },
      height: { min: 720, ideal: 1280 },
      aspectRatio: { ideal: 1.77777778 }
    }
  };
  if(cameraid) constraints.video.deviceId = {exact: cameraid};

  return await navigator.mediaDevices.getUserMedia(constraints)
}
let titles = (async () => { return await buildTitles();})();
document.addEventListener('keydown', event => {
  if(keyActions[event.key]) return keyActions[event.key]();
})