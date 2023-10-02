console.log("i am injected");

var recorder = null;
var mediaStream = null;
var recording = false;
let chunks = [];

const onAccessApproved = (stream) => {
  recorder = new MediaRecorder(stream);

  recorder.start();

  recorder.onstop = function () {
    stream.getTracks().forEach(function (track) {
      if (track.readyState === "live") {
        track.stop();
      }
    });
  };

  recorder.ondataavailable = function (event) {
    let recordedBlob = event.data;
    if (recordedBlob.size > 0) {
      if (recording) {
        sendVideoChunk(recordedBlob);
      }
    }
  };
};

function sendVideoChunk(chunk) {
  // Create a FormData object and append the chunk
  const formData = new FormData();
  formData.append("chunk", chunk, "video-chunk.webm");

  // Send the FormData as a POST request
  fetch("http://127.0.0.1:5000/upload", {
    method: "POST",
    body: formData,
  })
    .then((response) => {
      if (response.ok) {
        console.log("Video chunk successfully sent");
      } else {
        console.error("Failed to send video chunk:", response.statusText);
      }
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "request_recording") {
    console.log("requestng recording");

    sendResponse(`processed: ${message.action}`);

    navigator.mediaDevices
      .getDisplayMedia({
        audio: true,
        video: {
          width: 999999999,
          height: 999999999,
        },
      })
      .then((stream) => {
        onAccessApproved(stream);
      });
  }

  if (message.action == "stopvideo") {
    console.log("stopping video");
    sendResponse(`processed: ${message.action}`);
    if (!recorder) return console.log("no recorder");

    recorder.stop();
  }
});

// let url = URL.createObjectURL(recordedBlob);

// let a = document.createElement("a");

// a.style.display = "none";
// a.href = url;
// a.download = "screen-recording.webm";

// document.body.appendChild(a);
// a.click();

// document.body.removeChild(a);

// URL.revokeObjectURL(url);
