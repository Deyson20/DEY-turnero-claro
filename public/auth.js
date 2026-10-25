const adminAuth = {
  csrfToken: "",

  headers() {
    return this.csrfToken ? { "X-Admin-CSRF-Token": this.csrfToken } : {};
  },

  redirectToLogin() {
    window.location.replace("/login.html");
  },

  async initialize() {
    const response = await fetch("/api/auth/session");
    const result = await response.json();
    if (response.status === 401) {
      this.redirectToLogin();
      throw new Error("La sesión terminó. Inicia sesión de nuevo.");
    }
    if (!response.ok) throw new Error(result.error || "No se pudo validar la sesión.");
    this.csrfToken = result.csrf;
  },

  async logout() {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
      headers: this.headers(),
    });
    const result = await response.json();
    if (response.status === 401) {
      this.redirectToLogin();
      return;
    }
    if (!response.ok) throw new Error(result.error || "No se pudo cerrar la sesión.");
    this.redirectToLogin();
  },
};

window.adminAuth = adminAuth;
