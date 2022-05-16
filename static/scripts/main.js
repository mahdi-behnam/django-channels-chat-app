const thumbnails = [
  ...document
    .getElementById("desktop-people-list")
    .querySelectorAll(".chat-thumbnail"),
];
thumbnails.forEach((thumbnail) =>
  thumbnail.addEventListener("click", () => {
    //remove other selected thumbnails
    thumbnails.forEach((thumbnail) => thumbnail.classList.remove("selected"));
    //add 'selected' to the clicked thumbnail
    thumbnail.classList.add("selected");
  })
);

const coverer = document.getElementById("coverer");
const chatHeaderInfo = document.querySelector(".chat-info");
const chatExtendedInfoBox = document.querySelector(".extended-info-box");
const closeBtn = chatExtendedInfoBox.querySelector(".close-btn");
chatHeaderInfo.addEventListener("click", () => {
  coverer.classList.add("active");
  chatExtendedInfoBox.classList.add("show");
});
closeBtn.addEventListener("click", () => {
  coverer.classList.remove("active");
  chatExtendedInfoBox.classList.remove("show");
});
coverer.addEventListener("click", () => {
  closeBtn.click();
});

//emoji config
window.emojiPicker = new EmojiPicker({
  emojiable_selector: "[data-emojiable=true]",
  assetsPath: "http://onesignal.github.io/emoji-picker/lib/img/",
  popupButtonClasses: "ri-emotion-line",
});
window.emojiPicker.discover();

//mobile people list toggling
const peopleList = document.getElementById("mobile-people-list");
const mobileThumbnails = peopleList.querySelectorAll(".chat-thumbnail");
mobileThumbnails.forEach((thumbnail) =>
  thumbnail.addEventListener("click", () => {
    peopleList.classList.add("d-none");
  })
);

//mobile chat back button
const chatBackBtn = document.getElementById("mobile-chat-back-btn");
chatBackBtn.addEventListener("click", () => {
  peopleList.classList.remove("d-none");
});

//~~~~~~~~~~~hotbar file config~~~~~~~~~~~~~~~
const uploadStateBox = document.getElementById("upload-state");
const currentUploadState = document.getElementById("current-state");
const currentUploadPercent = document.getElementById("current-percent");
const uploadedSize = document.getElementById("uploaded-size");
const uploadedSizeUnit = document.getElementById("uploaded-size-unit");
const totalSize = document.getElementById("total-size");
const totalSizeUnit = document.getElementById("total-size-unit");
const progressbar = document.getElementById("progress-thumb");
const fileInput = document.getElementById("attachment");
const fileName = document.getElementById("attached-file-name");
const attachmentBtn = document.getElementById("attachment-btn");
const cancelAttachmentBtn = document.getElementById("cancel-attached-file-btn");
const sendBtn = document.getElementById("send-btn");
const messageForm = document.getElementById("message-send-form");
const fileForm = document.getElementById("file-upload-form");

window.addEventListener("click", () => {
  if (uploadStateBox.classList.contains("shown")) {
    uploadStateBox.classList.remove("shown");
  }
});
uploadStateBox.addEventListener("click", (e) => {
  e.stopPropagation();
});
cancelAttachmentBtn.onclick = () => {
  const isDeleteBtn =
    cancelAttachmentBtn.innerHTML === `<i class="ri-delete-bin-fill"></i>`
      ? true
      : false;
  // If it is in PENDING STATE, reset input's files
  if (fileInput.files.length && isDeleteBtn) {
    fileInput.value = "";
    uploadStateBox.classList.remove("shown");
  }
  // Else if the user wants to cancel ongoing upload
  else if (fileInput.files.length && !isDeleteBtn) {
    if (ajax) ajax.abort();
  }
};
attachmentBtn.onclick = (e) => {
  e.stopPropagation();

  if (fileInput.files.length && !uploadStateBox.classList.contains("shown")) {
    uploadStateBox.classList.add("shown");
  } else if (fileInput.files.length === 0) {
    fileInput.click();
  }
};

fileInput.onchange = () => {
  //if there are any files
  if (fileInput.files.length && !uploadStateBox.classList.contains("shown")) {
    const [name, extension] = fileInput.files[0].name.split(".");
    let shortName = name + "." + extension;
    if (name.length > 10) {
      shortName = name.slice(0, 10) + "... ." + extension;
    }
    fileName.innerHTML = shortName;
    cancelAttachmentBtn.style.display = "flex";
    cancelAttachmentBtn.innerHTML = `<i class="ri-delete-bin-fill"></i>`;
    uploadStateBox.classList.add("shown");
  }
};

const ajax = new XMLHttpRequest();
function uploadFile() {
  const file = fileInput.files[0];
  totalSizeUnit.innerText = convertBytes(file.size, 2)[1];
  const formdata = new FormData();
  formdata.append("file", file, file.name);
  ajax.upload.addEventListener("progress", fileUploadProgressHandler);
  ajax.upload.addEventListener("loadstart", fileUploadStartHandler);
  ajax.upload.addEventListener("load", fileUploadCompleteHandler);
  ajax.upload.addEventListener("error", fileUploadErrorHandler);
  ajax.upload.addEventListener("abort", fileUploadAbortHandler);
  ajax.open(
    "POST",
    "http://www.developphp.com/video/JavaScript/File-Upload-Progress-Bar-Meter-Tutorial-Ajax-PHP"
  );
  ajax.send(formdata);
}
function fileUploadProgressHandler(e) {
  const [formattedUploadedSize, formattedUploadedSizeUnit] = convertBytes(
    e.loaded,
    2
  );
  uploadedSize.innerText = formattedUploadedSize;
  uploadedSizeUnit.innerText = formattedUploadedSizeUnit;
  totalSize.innerText = convertBytes(e.total, 2)[0];
  const percent = Math.round((e.loaded / e.total) * 100);
  currentUploadPercent.innerText = percent + "%";
  progressbar.style.width = percent + "%";
}
function fileUploadStartHandler() {
  currentUploadState.innerText = "Uploading...";
  cancelAttachmentBtn.innerHTML = `<i class="ri-close-circle-fill"></i>`;
}
function fileUploadCompleteHandler() {
  currentUploadState.innerText = "Uploaded!";
  uploadStateBox.classList.remove("shown");
}
function fileUploadErrorHandler() {
  currentUploadPercent.innerText = "Upload Failed!";
}
function fileUploadAbortHandler() {
  currentUploadState.innerText = "Upload Aborted!";
  cancelAttachmentBtn.style.display = "none";
  fileInput.value = "";
  uploadStateBox.classList.remove("shown");
}

function convertBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return [parseFloat((bytes / Math.pow(k, i)).toFixed(dm)), sizes[i]];
}

// ~~~~~~~~~~hotbar message config~~~~~~~~~~
const messageInput = document.getElementById("message-input");

function sendMessage(str) {
  console.log(str);
}

sendBtn.onclick = (e) => {
  e.stopPropagation();
  if (fileInput.files.length) {
    uploadFile();
  }
  if (messageInput.value.trim().length) {
    sendMessage(messageInput.value);
  }
};
