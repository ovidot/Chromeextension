console.log("i am injected");

var recorder = null;
var mediaStream = null;
var recording = false;
let recordedChunks = [];

const onAccessApproved = (stream) => {
  recorder = new MediaRecorder(stream);

  recorder.start();
  recording = true;

  recorder.onstop = function () {
    stream.getTracks().forEach(function (track) {
      if (track.readyState === "live") {
        track.stop();
      }
    });
    recording = false;
  };

  recorder.ondataavailable = function (event) {
    let recordedBlob = event.data;
    recordedChunks.push(recordedBlob);
    if (recordedBlob.size > 0) {
      if (recording) {
        sendVideoChunk(recordedBlob);
      } else console.log("not recording");
    }
  };
};

function sendVideoChunk(chunk) {
  // Create a FormData object and append the chunk
  const formData = new FormData();
  formData.append("video", chunk, "video-chunk.webm");

  // Send the FormData as a POST request
  fetch("http://127.0.0.1:5000/upload", {
    method: "POST",
    body: formData,
  })
    .then((response) => {
      if (response.ok) {
        alert("Video chunk successfully sent");
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

//CONSIDER WHEN PUSHING TO RECORDEDCHUNK
//{blob: recordedBlob, timecode: Date()}
