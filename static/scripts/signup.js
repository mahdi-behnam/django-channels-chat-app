const usernameInput = document.getElementById("username");
const usernameFormControl = usernameInput.parentElement;
const passwordInput = document.getElementById("password");
const passwordEye = document.getElementById("password-eye");
const passwordRepeatInput = document.getElementById("password-repeat");
const passwordRepeatEye = document.getElementById("password-repeat-eye");

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

passwordRepeatEye.onclick = () => {
  if (passwordRepeatInput.type === "text") {
    passwordRepeatInput.type = "password";
    passwordRepeatEye.classList.remove("ri-eye-fill");
    passwordRepeatEye.classList.add("ri-eye-off-fill");
  } else {
    passwordRepeatInput.type = "text";
    passwordRepeatEye.classList.remove("ri-eye-off-fill");
    passwordRepeatEye.classList.add("ri-eye-fill");
  }
};
