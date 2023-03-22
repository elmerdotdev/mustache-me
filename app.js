// Access camera
var video = document.querySelector('#videoElement');
if (navigator.mediaDevices.getUserMedia) {
  navigator.mediaDevices
    .getUserMedia({ video: true })
    .then(function (stream) {
      video.srcObject = stream;
    })
    .catch(function (err) {
      console.log('Something went wrong!');
    });
}

// We only get to work when the vision button is clicked
document.querySelector('#vision_button').addEventListener('click', (evt) => {
  // extract image as base64, scale it down to reduce data transfer speed
  var scale = 1;
  var canvas = document.createElement('canvas');
  canvas.width = video.videoWidth * scale;
  canvas.height = video.videoHeight * scale;
  canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);

  // dataUrl contains base64 version of image
  var dataUrl = canvas.toDataURL();

  // Positions
  var leftEyeX;
  var rightEyeX;
  var noseBottomX;
  var noseBottomY;
  var rollAngle;

  // Mustache
  var mustache =
    'https://res.cloudinary.com/dp53wf7gb/image/upload/v1679438920/mustache_ccujbg.png';

  // Send image to google to analyze
  fetch(
    'https://vision.googleapis.com/v1/images:annotate?key=AIzaSyA14aZIcHKO5fj3_msyfpuhu2HzGkLCLsE',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            features: {
              type: 'FACE_DETECTION',
            },
            image: {
              // have to extract only the image data from dataURL
              content: dataUrl.substring('data:image/png;base64,'.length),
            },
          },
        ],
      }),
    }
  )
    .then((resp) => {
      return resp.json();
    })
    .then((json) => {
      // Output the response
      document.querySelector('#mustacheWrapper').innerHTML = '';
      document.querySelector('#codeWrapper').innerHTML = '';
      json.responses[0].faceAnnotations.forEach((annotation) => {
        rollAngle = annotation.rollAngle;
        annotation.landmarks.forEach((landmark) => {
          if (landmark.type === 'LEFT_EYE') {
            leftEyeX = landmark.position.x;
          }

          if (landmark.type === 'RIGHT_EYE') {
            rightEyeX = landmark.position.x;
          }

          if (landmark.type === 'NOSE_BOTTOM_CENTER') {
            noseBottomX = landmark.position.x;
            noseBottomY = landmark.position.y;
          }
        });

        let mustacheDiv = document.createElement('div');
        mustacheDiv.innerHTML = `<img src="${mustache}" width="${Math.round(
          rightEyeX - leftEyeX
        )}px" style="position: absolute; top: ${Math.round(
          noseBottomY
        )}px; left: ${Math.round(
          noseBottomX - (rightEyeX - leftEyeX) / 2
        )}px; transform: rotate(${rollAngle}deg)" />`;

        document.querySelector('#mustacheWrapper').append(mustacheDiv);

        let codeDiv = document.createElement('div');
        codeDiv.innerHTML = `
                  <div>Mustache width: ${rightEyeX - leftEyeX} pixels</div>
                  <div>Mustache x-axis: ${
                    noseBottomX - (rightEyeX - leftEyeX) / 2
                  }</div>
                  <div>Mustache y-axis: ${noseBottomY}</div>
                  <div>Mustache rotation: ${rollAngle} degrees</div>
                `;

        // Output log to code wrapper
        document.querySelector('#codeWrapper').append(codeDiv);
      });
    });
});
