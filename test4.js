console.log("Hi, I have been injected");

var recorder = null;
var videoId = null; // Variable to store the video ID
var recordedChunks = []; // Array to store the data chunks

//https://hngx-chrome-extension.onrender.com/

function onAccessApproved(stream) {
  // Make an initial API request to start recording and get the video ID
  fetch("https://hngx-chrome-extension.onrender.com/start_video", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  })
    .then((response) => response.json())
    .then((data) => {
      videoId = data.video_id; // Store the received video ID
      console.log("Video recording started with ID:", videoId);

      recorder = new MediaRecorder(stream);
      recorder.start();

      recorder.onstop = function () {
        stream.getTracks().forEach(function (track) {
          if (track.readyState === "live") {
            track.stop();
          }
        });

        // Create a blob from the recorded data chunks
        const recordedBlob = new Blob(recordedChunks, { type: "video/webm" });

        // Save the recorded video to the API endpoint
        saveRecordedVideo(recordedBlob, videoId);
        recordedChunks = []; // Clear the array

        // Redirect to a localhost URL for rendering or perform other actions
        redirectToLocalhost();
      };

      recorder.ondataavailable = function (event) {
        if (event.data.size > 0) {
          recordedChunks.push(event.data);
        }
      };
    })
    .catch((error) => {
      console.error("Error starting recording:", error);
    });
}

// Save the video blob to the API endpoint
function saveRecordedVideo(blob, videoId) {
  const formData = new FormData();
  formData.append("video", blob, "screen-recording.webm"); // Video is the field name

  fetch(`https://hngx-chrome-extension.onrender.com/update_video/${videoId}`, {
    method: "POST",
    body: formData,
  })
    .then((response) => {
      if (response.ok) {
        console.log("Video successfully sent to API");
      } else {
        console.error("Failed to send video to API:", response.statusText);
      }
    })
    .catch((error) => {
      console.log("Error sending video to API", error);
    });
}

// Redirect to a localhost URL for rendering
function redirectToLocalhost() {
  // Replace 'http://localhost:3000/videoPlayback' with your desired localhost URL
  const localhostURL = `http://localhost:3000/Videorepo/${videoId}`;

  // Change the window location to the localhost URL
  window.location.href = localhostURL;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "request_recording") {
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
    if (!recorder) {
      return console.log("No recorder");
    } else {
      recorder.stop();
    }
  }
});
