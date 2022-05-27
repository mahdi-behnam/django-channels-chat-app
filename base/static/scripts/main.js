//Messages Socket Config:
const roomID = JSON.parse(document.getElementById("room-id").textContent);
const chatSocket = new WebSocket(
  "ws://" + window.location.host + `/ws/chat/${roomID}/`
);
chatSocket.onmessage = function (e) {
  const data = JSON.parse(e.data);

  if (data.hasOwnProperty("message")) {
    strToAdd = `${data.user}: ${data.message}<br />`;
    document.querySelector("#chat-log").innerHTML += strToAdd;
  }
  //Else If a File has been received...
  else if (data.hasOwnProperty("file_type")) {
    if (data.file_type === "image")
      strToAdd = `${data.user}: <img src="${data.file_url}" width="200" height="200" /><br />`;
    else if (data.file_type === "video")
      strToAdd = `${data.user}: <video width="200" height="200" controls><source src="${data.file_url}"/></video><br />`;
    else
      strToAdd = `${data.user}: <a href="${data.file_url}">${data.file_name}</a><br />`;
    document.querySelector("#chat-log").innerHTML += strToAdd;
  }
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
const callSocket = new WebSocket(
  "ws://" + window.location.host + `/ws/call/${roomID}/`
);
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

const startCallBtn = document.getElementById("start-call");
const endCallBtn = document.getElementById("end-call");

callSocket.onmessage = function (e) {
  const data = JSON.parse(e.data);
  //If an Offer to make a call has been received...
  if (data.hasOwnProperty("offer")) {
    makeAnswer(data.offer);
  }
  // Else If an Answer to a call has been received...
  else if (data.hasOwnProperty("answer")) {
    addAnswer(data.answer);
  }
  // Else If an Ice Candidate for a call has been received...
  else if (data.hasOwnProperty("ice")) {
    if (peerConnection) {
      addIce(data.ice);
    }
  }
  // Else If a call status event has been received...
  else if (data.hasOwnProperty("status")) {
    if (data.status === "ended") {
      if (peerConnection) peerConnection.close();
      stopTracks();
    }
  }
};

callSocket.onclose = function (e) {
  console.error("Chat socket closed unexpectedly");
};

const setLocalStream = async () => {
  localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: false,
  });
  document.getElementById("local-user").srcObject = localStream;
};

const createPeerConnection = async () => {
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
      callSocket.send(
        JSON.stringify({
          type: "ice",
          data: {
            ice: event.candidate,
          },
        })
      );
    }
  };
};

const makeOffer = async () => {
  await createPeerConnection();
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  callSocket.send(
    JSON.stringify({
      type: "offer",
      data: {
        offer: offer,
      },
    })
  );
};

const makeAnswer = async (offer) => {
  if (confirm("Incoming Call...")) {
    await setLocalStream();
    await createPeerConnection();
    await peerConnection.setRemoteDescription(offer);

    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    callSocket.send(
      JSON.stringify({
        type: "answer",
        data: {
          answer: answer,
        },
      })
    );
  } else {
    callSocket.send(
      JSON.stringify({
        type: "call_status",
        data: {
          status: "ended",
        },
      })
    );
  }
};

const addAnswer = async (answer) => {
  await peerConnection.setRemoteDescription(answer);
};

const stopTracks = async () => {
  localStream.getTracks().forEach((track) => track.stop());
  document.getElementById("local-user").srcObject = null;
  document.getElementById("remote-user").srcObject = null;
};

const endCall = async () => {
  if (peerConnection.connectionState !== "closed") {
    await peerConnection.close();
    stopTracks();
    callSocket.send(
      JSON.stringify({
        type: "call_status",
        data: {
          status: "ended",
        },
      })
    );
  }
};

const addIce = async (ice) => {
  await peerConnection.addIceCandidate(ice);
};

document.getElementById("logger").onclick = () => {
  console.log(peerConnection);
  console.log(localStream);
  console.log(remoteStream);
};

startCallBtn.onclick = async () => {
  await setLocalStream();
  await makeOffer();
};

endCallBtn.onclick = endCall;
