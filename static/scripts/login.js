//loader config...
window.onload = () => setTimeout(removeLoader, 2000); //wait for page load PLUS two seconds.
function removeLoader() {
  document.getElementById("loader-wrapper").classList.add("loaded");
}

//login config...
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const passwordEye = document.getElementById("password-eye");

passwordEye.onclick = () => {
  if (passwordInput.type === "text") {
    passwordInput.type = "password";
    passwordEye.classList.remove("ri-eye-fill");
    passwordEye.classList.add("ri-eye-off-fill");
  } else {
    passwordInput.type = "text";
    passwordEye.classList.remove("ri-eye-off-fill");
    passwordEye.classList.add("ri-eye-fill");
  }
};
