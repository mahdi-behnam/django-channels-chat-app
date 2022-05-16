//call start btns
const startVoiceCallBtn = document.getElementById("start-voice-call");
const startVideoCallBtn = document.getElementById("start-video-call");
const startShareScreenBtn = document.getElementById("start-share-screen");

//call end btns
const endVoiceCallBtn = document.getElementById("end-voice-call");
const endVideoCallBtn = document.getElementById("end-video-call");
const endShareScreenBtn = document.getElementById("end-share-screen");

//call displayers
const voiceCallDisplayer = document.getElementById("voice-call-displayer");
const videoCallDisplayer = document.getElementById("video-call-displayer");
const shareScreenDisplayer = document.getElementById("share-screen-displayer");
const remoteShareScreenDisplayer = document.getElementById(
  "share-screen-displayer-remote"
);

//~~~~~~~~~~~~~~~~~~~ Voice Call ~~~~~~~~~~~~~~~~~~~
startVoiceCallBtn.onclick = () => {
  voiceCallDisplayer.classList.remove("d-none");
};
endVoiceCallBtn.onclick = () => {
  voiceCallDisplayer.classList.add("d-none");
};

//~~~~~~~~~~~~~~~~~~~ Video Call ~~~~~~~~~~~~~~~~~~~
startVideoCallBtn.onclick = () => {
  videoCallDisplayer.classList.remove("d-none");
};
endVideoCallBtn.onclick = () => {
  videoCallDisplayer.classList.add("d-none");
};

//~~~~~~~~~~~~~~~~~~ Share Screen ~~~~~~~~~~~~~~~~~~
startShareScreenBtn.onclick = () => {
  shareScreenDisplayer.classList.remove("d-none");
};
endShareScreenBtn.onclick = () => {
  shareScreenDisplayer.classList.add("d-none");
  if (!remoteShareScreenDisplayer.classList.contains("d-none"))
    remoteShareScreenDisplayer.classList.add("d-none");
};
