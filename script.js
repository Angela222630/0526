const videoElement = document.getElementById('input_video');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const expressionElement = document.getElementById('expression');
const hintElement = document.getElementById('hint');
const toggleButton = document.getElementById('toggleCamera');

let usingFrontCamera = true;
let lastExpression = '';
let lastSpeakTime = 0;

function speakMessage(message) {
  const now = Date.now();
  if (now - lastSpeakTime < 2500) return;
  if (!window.speechSynthesis) return;
  const utterance = new SpeechSynthesisUtterance(message);
  utterance.lang = 'zh-TW';
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
  lastSpeakTime = now;
}

function classifyExpression(landmarks) {
  if (!landmarks || landmarks.length === 0) return '無法辨識';

  const leftMouth = landmarks[61];
  const rightMouth = landmarks[291];
  const topLip = landmarks[13];
  const bottomLip = landmarks[14];
  const leftEyeTop = landmarks[159];
  const leftEyeBottom = landmarks[145];
  const rightEyeTop = landmarks[386];
  const rightEyeBottom = landmarks[374];

  const mouthWidth = Math.hypot(
    rightMouth.x - leftMouth.x,
    rightMouth.y - leftMouth.y
  );
  const mouthOpen = Math.hypot(
    bottomLip.x - topLip.x,
    bottomLip.y - topLip.y
  );
  const eyeLeftOpen = Math.hypot(
    leftEyeBottom.x - leftEyeTop.x,
    leftEyeBottom.y - leftEyeTop.y
  );
  const eyeRightOpen = Math.hypot(
    rightEyeBottom.x - rightEyeTop.x,
    rightEyeBottom.y - rightEyeTop.y
  );

  const smileRatio = mouthWidth / mouthOpen;
  const eyeOpenAvg = (eyeLeftOpen + eyeRightOpen) / 2;

  if (mouthOpen > 0.05 && smileRatio > 4.5) {
    return '開心笑臉';
  }
  if (mouthOpen > 0.08 && smileRatio <= 4.5) {
    return '驚訝或張嘴';
  }
  if (eyeOpenAvg < 0.015) {
    return '專注凝視';
  }
  return '平常臉';
}

function makeFeedback(expression) {
  switch (expression) {
    case '開心笑臉':
      return '你今天看起來心情不錯喔!!';
    case '驚訝或張嘴':
      return '哇~ 你好像很驚訝呢。';
    case '專注凝視':
      return '看起來你正在認真思考。';
    case '平常臉':
      return '保持自然就很棒了。';
    default:
      return '請稍微移動一下，讓我更清楚看到你的臉。';
  }
}

function onResults(results) {
  canvasElement.width = videoElement.videoWidth;
  canvasElement.height = videoElement.videoHeight;
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

  if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
    const landmarks = results.multiFaceLandmarks[0];
    drawConnectors(canvasCtx, landmarks, FACEMESH_TESSELATION, {
      color: '#00FFE1',
      lineWidth: 1,
    });
    drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_EYE, {
      color: '#FF2C7A',
      lineWidth: 1,
    });
    drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_EYE, {
      color: '#FF2C7A',
      lineWidth: 1,
    });
    drawConnectors(canvasCtx, landmarks, FACEMESH_LIPS, {
      color: '#EA5D3E',
      lineWidth: 2,
    });

    const expression = classifyExpression(landmarks);
    expressionElement.textContent = expression;
    hintElement.textContent = makeFeedback(expression);

    if (expression !== lastExpression) {
      speakMessage(makeFeedback(expression));
      lastExpression = expression;
    }
  } else {
    expressionElement.textContent = '未偵測到臉部';
    hintElement.textContent = '請將臉部移到鏡頭範圍內。';
  }

  canvasCtx.restore();
}

const faceMesh = new FaceMesh({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
});
faceMesh.setOptions({
  maxNumFaces: 1,
  refineLandmarks: true,
  minDetectionConfidence: 0.6,
  minTrackingConfidence: 0.6,
});
faceMesh.onResults(onResults);

let camera = null;
function startCamera() {
  const constraints = {
    video: {
      width: { ideal: 720 },
      height: { ideal: 1280 },
      facingMode: usingFrontCamera ? 'user' : 'environment',
    },
  };

  if (camera) {
    camera.stop();
  }

  camera = new Camera(videoElement, {
    onFrame: async () => {
      await faceMesh.send({image: videoElement});
    },
    width: 720,
    height: 1280,
  });
  camera.start();
}

toggleButton.addEventListener('click', () => {
  usingFrontCamera = !usingFrontCamera;
  toggleButton.textContent = usingFrontCamera ? '切換到後鏡頭' : '切換到前鏡頭';
  startCamera();
});

window.addEventListener('DOMContentLoaded', () => {
  toggleButton.textContent = '切換到後鏡頭';
  startCamera();
});
