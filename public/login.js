const loginForm = document.querySelector("#login-form");
const statusMessage = document.querySelector("#status");

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(loginForm);
  const submitButton = loginForm.querySelector("button[type='submit']");
  submitButton.disabled = true;
  statusMessage.textContent = "";
  statusMessage.classList.remove("error");

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: formData.get("username"),
        password: formData.get("password"),
      }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "No se pudo iniciar sesión.");
    window.location.replace("/");
  } catch (error) {
    statusMessage.textContent = error.message;
    statusMessage.classList.add("error");
  } finally {
    submitButton.disabled = false;
  }
});
