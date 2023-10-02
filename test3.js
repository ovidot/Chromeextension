// HTML: Create a button to trigger the recording and another button to submit the video
// <button id="startRecording">Start Recording</button>
// <button id="stopRecording">Stop Recording</button>
// <input type="file" id="videoFile" accept="video/*">
// <button id="submitVideo">Submit Video</button>

document.addEventListener("DOMContentLoaded", () => {
  let mediaRecorder;
  let recordedChunks = [];

  const startRecording = document.getElementById("startRecording");
  const stopRecording = document.getElementById("stopRecording");
  const videoFileInput = document.getElementById("videoFile");
  const submitVideo = document.getElementById("submitVideo");

  startRecording.addEventListener("click", () => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = (event) => {
          recordedChunks.push(event.data);
        };
        mediaRecorder.start();
      })
      .catch((error) => console.error("Error accessing media devices:", error));
  });

  stopRecording.addEventListener("click", () => {
    mediaRecorder.stop();
  });

  mediaRecorder.addEventListener("stop", () => {
    const blob = new Blob(recordedChunks, { type: "video/mp4" });
    const url = URL.createObjectURL(blob);
    videoFileInput.src = url;
    videoFileInput.controls = true;
  });

  submitVideo.addEventListener("click", () => {
    const blob = new Blob(recordedChunks, { type: "video/mp4" });

    const formData = new FormData();
    formData.append("video", blob, "recorded_video.mp4");

    fetch("/upload", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.text())
      .then((message) => console.log("Server response:", message))
      .catch((error) => console.error("Error uploading video:", error));
  });
});
