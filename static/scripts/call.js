//incoming call displayer and btns
const incomingCallWindow = document.getElementById("incoming-call");
const incomingCallAcceptBtn = document.getElementById(
  "incoming-call-accept-btn"
);
const incomingCallRejectBtn = document.getElementById(
  "incoming-call-reject-btn"
);

//call start btns
const startVoiceCallBtn = document.getElementById("start-voice-call");
const startVideoCallBtn = document.getElementById("start-video-call");
const startShareScreenBtn = document.getElementById("start-share-screen");

//call util btns
const endVoiceCallBtn = document.getElementById("end-voice-call");
const muteVoiceVoiceCallBtn = document.getElementById("mute-voice-voice-call");

const endVideoCallBtn = document.getElementById("end-video-call");
const muteVoiceVideoCallBtn = document.getElementById("mute-voice-video-call");
const muteVideoVideoCallBtn = document.getElementById("mute-video-video-call");

const endShareScreenBtn = document.getElementById("end-share-screen");
const muteScreenShareScreenBtn = document.getElementById(
  "mute-screen-share-screen"
);
const muteVoiceShareScreenBtn = document.getElementById(
  "mute-voice-share-screen"
);

//call mediaStream tags
const voiceCallLocalAudioTag = document.getElementById(
  "voice-call-local-audio-tag"
);
const voiceCallRemoteAudioTag = document.getElementById(
  "voice-call-remote-audio-tag"
);
const videoCallLocalVideoTag = document.getElementById(
  "video-call-local-video-tag"
);
const videoCallRemoteVideoTag = document.getElementById(
  "video-call-remote-video-tag"
);
const shareScreenVideoTag = document.getElementById(
  "share-screen-remote-video-tag"
);

//call displayers
const voiceCallDisplayer = document.getElementById("voice-call-displayer");
const videoCallDisplayer = document.getElementById("video-call-displayer");
const shareScreenDisplayer = document.getElementById("share-screen-displayer");
const remoteShareScreenDisplayer = document.getElementById(
  "share-screen-displayer-remote"
);

//Config:
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

callSocket.onmessage = function (e) {
  const data = JSON.parse(e.data);
  console.log("message event triggered : => ", data);
  //If an Offer to make a call has been received...
  if (data.hasOwnProperty("offer")) {
    console.log("offer received !");
    //show incoming call box...
    incomingCallWindow.classList.add("shown");
    incomingCallAcceptBtn.onclick = () => {
      makeAnswer(data);
      incomingCallWindow.classList.remove("shown");
      if (data.call_type === "voice-call") {
        voiceCallDisplayer.classList.remove("d-none");
      } else if (data.call_type === "video-call") {
        videoCallDisplayer.classList.remove("d-none");
      } else if (data.call_type === "share-screen") {
        remoteShareScreenDisplayer.classList.remove("d-none");
      }
    };
    incomingCallRejectBtn.onclick = () => {
      callSocket.send(
        JSON.stringify({
          type: "call_status",
          data: {
            status: "ended",
          },
        })
      );
    };
  }
  // Else If an Answer to a call has been received...
  else if (data.hasOwnProperty("answer")) {
    console.log("answer received !");
    addAnswer(data.answer);
  }
  // Else If an Ice Candidate for a call has been received...
  else if (data.hasOwnProperty("ice")) {
    console.log("ice received !");
    if (peerConnection) {
      addIce(data.ice);
    }
  }
  // Else If a call status event has been received...
  else if (data.hasOwnProperty("status")) {
    console.log("call status has been received !");
    if (data.status === "ended") {
      if (peerConnection) peerConnection.close();
      stopTracks();
      //hiding all displayers if any of them is showing
      if (!voiceCallDisplayer.classList.contains("d-none"))
        voiceCallDisplayer.classList.add("d-none");
      if (!videoCallDisplayer.classList.contains("d-none"))
        videoCallDisplayer.classList.add("d-none");
      if (!shareScreenDisplayer.classList.contains("d-none"))
        shareScreenDisplayer.classList.add("d-none");
    }
  }
};

callSocket.onclose = function (e) {
  console.error("Chat socket closed unexpectedly");
};

const setLocalStream = async (type) => {
  let localStreamTag;
  if (type === "voice-call") {
    localStreamTag = voiceCallLocalAudioTag;
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } else if (type === "video-call") {
    localStreamTag = videoCallLocalVideoTag;
    localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
  } else if (type === "share-screen") {
    localStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true,
    });
    //we don't need to show local stream to the user when 'sharing screen'...
    return;
  }
  localStreamTag.srcObject = localStream;
};

const createPeerConnection = async (type) => {
  peerConnection = new RTCPeerConnection(servers);

  remoteStream = new MediaStream();
  let remoteStreamTag;
  if (type === "voice-call") {
    remoteStreamTag = voiceCallRemoteAudioTag;
  } else if (type === "video-call") {
    remoteStreamTag = videoCallRemoteVideoTag;
  } else if (type === "share-screen") {
    remoteStreamTag = shareScreenVideoTag;
  }
  remoteStreamTag.srcObject = remoteStream;

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

const makeOffer = async (type) => {
  await createPeerConnection(type);
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  callSocket.send(
    JSON.stringify({
      type: "offer",
      data: {
        offer: offer,
        callType: type,
      },
    })
  );
};

const makeAnswer = async (data) => {
  await setLocalStream(data.call_type);
  await createPeerConnection(data.call_type);
  await peerConnection.setRemoteDescription(data.offer);

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
};

const addAnswer = async (answer) => {
  await peerConnection.setRemoteDescription(answer);
};

const stopTracks = async () => {
  localStream.getTracks().forEach((track) => track.stop());
  document
    .querySelectorAll("[media-stream-tag]")
    .forEach((mediaStreamTag) => (mediaStreamTag.srcObject = null));
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

startVoiceCallBtn.onclick = async () => {
  voiceCallDisplayer.classList.remove("d-none");
  await setLocalStream("voice-call");
  await makeOffer("voice-call");
};

startVideoCallBtn.onclick = async () => {
  videoCallDisplayer.classList.remove("d-none");
  await setLocalStream("video-call");
  await makeOffer("video-call");
};

startShareScreenBtn.onclick = async () => {
  shareScreenDisplayer.classList.remove("d-none");
  await setLocalStream("share-screen");
  await makeOffer("share-screen");
};

endVoiceCallBtn.onclick = () => {
  endCall();
  voiceCallDisplayer.classList.add("d-none");
};
endVideoCallBtn.onclick = () => {
  endCall();
  videoCallDisplayer.classList.add("d-none");
};
endShareScreenBtn.onclick = () => {
  endCall();
  shareScreenDisplayer.classList.add("d-none");
  if (!remoteShareScreenDisplayer.classList.contains("d-none"))
    remoteShareScreenDisplayer.classList.add("d-none");
};

//mute btns config:
muteVoiceVoiceCallBtn.onclick = () => {
  const currentState = localStream.getAudioTracks()[0].enabled;
  localStream.getAudioTracks()[0].enabled = !currentState;
  muteVoiceVoiceCallBtn.classList.toggle("muted");
};
muteVoiceVideoCallBtn.onclick = () => {
  const currentState = localStream.getAudioTracks()[0].enabled;
  localStream.getAudioTracks()[0].enabled = !currentState;
  muteVoiceVideoCallBtn.classList.toggle("muted");
};
muteVideoVideoCallBtn.onclick = () => {
  const currentState = localStream.getVideoTracks()[0].enabled;
  localStream.getVideoTracks()[0].enabled = !currentState;
  muteVideoVideoCallBtn.classList.toggle("muted");
};
muteVoiceShareScreenBtn.onclick = () => {
  const currentState = localStream.getAudioTracks()[0].enabled;
  localStream.getAudioTracks()[0].enabled = !currentState;
  muteVoiceShareScreenBtn.classList.toggle("muted");
};
muteScreenShareScreenBtn.onclick = () => {
  const currentState = localStream.getVideoTracks()[0].enabled;
  localStream.getVideoTracks()[0].enabled = !currentState;
  muteScreenShareScreenBtn.classList.toggle("muted");
};
