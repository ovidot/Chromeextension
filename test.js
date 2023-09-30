console.log("Hi, I have been injected");

var recorder = null;
var mediaStream = null;
var recording = false;
var chunkSize = 1024 * 1024; // Adjust the chunk size as needed

function onAccessApproved(stream) {
  mediaStream = stream;

  recorder = new MediaRecorder(stream, { mimeType: "video/webm" });

  recorder.ondataavailable = function (event) {
    if (event.data.size > 0) {
      if (recording) {
        sendVideoChunk(event.data);
      }
    }
  };

  recorder.onstop = function () {
    if (mediaStream) {
      mediaStream.getTracks().forEach(function (track) {
        if (track.readyState === "live") {
          track.stop();
        }
      });
    }
    recording = false;
  };

  // Start recording immediately
  recorder.start();
  recording = true;
}

function sendVideoChunk(chunk) {
  // Create a FormData object and append the chunk
  const formData = new FormData();
  formData.append("chunk", chunk, "video-chunk.webm");

  // Send the FormData as a POST request
  fetch("https://your-python-endpoint-url", {
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
  if (message.action === "request_user_permission") {
    console.log("Requesting recording permission");

    sendResponse(`processed: ${message.action}`);

    // Request the browser to grant permission for recording feature
    navigator.mediaDevices
      .getDisplayMedia({
        audio: true,
        video: {
          width: 9999999999,
          height: 9999999999,
        },
      })
      .then((stream) => {
        onAccessApproved(stream);
      });
  }

  if (message.action === "stopvideo") {
    console.log("Stopping video");
    sendResponse(`processed: ${message.action}`);
    if (recorder) {
      recorder.stop();
    }
  }
});
