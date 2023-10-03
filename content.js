console.log("Hi, I have been injected");

var recorder;
var videoId; // Variable to store the video ID
var recordedChunks = []; // Array to store the data chunks

//https://hngx-chrome-extension.onrender.com/

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "request_recording") {
    console.log("Requesting recording permission");

    sendResponse(`processed: ${message.action}`);

    // Request the browser to grant permission for recording feature
    navigator.mediaDevices
      .getDisplayMedia({
        audio: true,
        video: true,
      })
      .then((stream) => {
        onAccessApproved(stream);
      });
  }

  if (message.action === "stopvideo") {
    console.log("Stopping video");
    sendResponse(`processed: ${message.action}`);
    if (!recorder) return console.log("No recorder");

    recorder.stop();
  }
});

function onAccessApproved(stream) {
  // Make an initial API request to start recording and get the video ID
  fetch("https://ovidotvideo.onrender.com/start_video", {
    method: "POST",
    // headers: {
    //   "Content-Type": "application/json",
    // },
    // body: JSON.stringify({}),
  })
    .then((response) => response.json())
    .then((data) => {
      videoId = data.video_id; // Store the received video ID
      console.log("Video recording created with ID:", videoId);

      recorder = new MediaRecorder(stream, {
        mimeType: "video/webm; codecs=vp8",
      });
      recorder.start(3000);
      console.log("started recorder");

      recorder.ondataavailable = function (event) {
        console.log(event.data.size);
        if (event.data.size > 0) {
          recordedChunks.push(event.data);
          console.log(recordedChunks);
        }
      };

      recorder.onstop = () => {
        console.log("available video id = ", videoId);
        stream.getTracks().forEach(function (track) {
          if (track.readyState === "live") {
            track.stop();
          }
        });
        recording = false;

        // Create a blob from the recorded data chunks
        const blob = new Blob(recordedChunks, {
          type: "video/webm; codecs=vp8",
        });
        // blobUrl = URL.createObjectURL(blob);

        console.log("recorded chunk", recordedChunks, "blob", blob);

        // Save the recorded video to the API endpoint
        saveRecordedVideo(blob, videoId);
        recordedChunks = []; // Clear the array

        // Redirect to a localhost URL for rendering or perform other actions
        redirectToLocalhost(videoId);
      };
    })
    .catch((error) => {
      console.error("Error starting recording:", error);
    });
}

// Save the video blob to the API endpoint
function saveRecordedVideo(blob, videoId) {
  const formData = new FormData();
  formData.append("video", blob, "screen-recording"); // Video is the field name

  fetch(`https://ovidotvideo.onrender.com/update_video/${videoId}`, {
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
function redirectToLocalhost(videoId) {
  const localhostURL = `https://helpmeout-seven.vercel.app/Record/${videoId}?videoId=${videoId}`;

  // Change the window location to the localhost URL
  window.open(localhostURL, "_blank");
}
