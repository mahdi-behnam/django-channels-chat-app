//Messages Socket Config:
const roomID = JSON.parse(document.getElementById("room-id").textContent);
const chatSocket = new WebSocket(
  "ws://" + window.location.host + `/ws/chat/${roomID}/`
);
chatSocket.onmessage = function (e) {
  const data = JSON.parse(e.data);
  console.log(data);
  strToAdd = `${data.user}: ${data.message}<br />`;
  if (data.file_type === "image")
    strToAdd = `${data.user}: <img src="${data.file_url}" width="200" height="200" /><br />`;
  else if (data.file_type === "video")
    strToAdd = `${data.user}: <video width="200" height="200" controls><source src="${data.file_url}"/></video><br />`;
  else if (data.file_type === null)
    strToAdd = `${data.user}: <a href="${data.file_url}">${data.file_name}</a><br />`;
  document.querySelector("#chat-log").innerHTML += strToAdd;
};
chatSocket.onclose = function (e) {
  console.error("Chat socket closed unexpectedly");
};
document.querySelector("#chat-message-input").focus();
document.querySelector("#chat-message-input").onkeyup = function (e) {
  if (e.keyCode === 13) {
    // enter, return
    document.querySelector("#chat-message-submit").click();
  }
};
document.querySelector("#chat-message-submit").onclick = function (e) {
  const messageInputDom = document.querySelector("#chat-message-input");
  const message = messageInputDom.value;
  chatSocket.send(
    JSON.stringify({
      message: message,
      user: "{{request.user}}",
    })
  );
  messageInputDom.value = "";
};

//MEDIA FORM
document.querySelector("#media-form").addEventListener("submit", (e) => {
  const form = e.target;
  fetch(form.action, {
    method: form.method,
    body: new FormData(form),
  }).catch((e) => console.log(e));
  e.preventDefault();
});

//Video Chat Config:
let peerConnection;
let localStream;
let remoteStream;
let servers = {
  iceServers: [
    {
      urls: [
        "stun:stun1.l.google.com:19302",
        "stun:stun2.l.google.com:19302",
        "stun:stun3.l.google.com:19302",
        "stun:stun4.l.google.com:19302",
      ],
    },
  ],
};

const makeOfferBtn = document.getElementById("make-offer");
const makeAnswerBtn = document.getElementById("make-answer");
const addAnswerBtn = document.getElementById("add-answer");

const offerTextArea = document.getElementById("offer");
const answerTextArea = document.getElementById("answer");

const init = async () => {
  localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: false,
  });

  document.getElementById("local-user").srcObject = localStream;
};

const createPeerConnection = async (sdpType) => {
  peerConnection = new RTCPeerConnection(servers);

  remoteStream = new MediaStream();
  document.getElementById("remote-user").srcObject = remoteStream;

  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });

  peerConnection.ontrack = (event) => {
    event.streams[0]
      .getTracks()
      .forEach((track) => remoteStream.addTrack(track));
  };

  peerConnection.onicecandidate = async (event) => {
    if (event.candidate) {
      if (sdpType === "offer") {
        offerTextArea.value = JSON.stringify(peerConnection.localDescription);
      } else {
        answerTextArea.value = JSON.stringify(peerConnection.localDescription);
      }
    }
  };
};

const makeOffer = async () => {
  createPeerConnection("offer");

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  offerTextArea.value = JSON.stringify(peerConnection.localDescription);
};

const makeAnswer = async () => {
  createPeerConnection("answer");

  const offer = JSON.parse(offerTextArea.value);
  await peerConnection.setRemoteDescription(offer);

  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);

  answerTextArea.value = JSON.stringify(peerConnection.localDescription);
};

const addAnswer = async () => {
  const answer = JSON.parse(answerTextArea.value);
  await peerConnection.setRemoteDescription(answer);
};

init();

makeOfferBtn.onclick = makeOffer;
makeAnswerBtn.onclick = makeAnswer;
addAnswerBtn.onclick = addAnswer;
document.getElementById("logger").onclick = () => {
  console.log(peerConnection);
  console.log(localStream.getTracks());
  console.log(remoteStream.getTracks());
};
