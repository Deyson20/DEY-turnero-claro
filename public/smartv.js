const turnName = document.querySelector("#turn-name");
const turnCode = document.querySelector("#current-heading");
const turnPosition = document.querySelector("#turn-position");
const statusMessage = document.querySelector("#status");
let isRefreshing = false;

async function getJson(url) {
  const response = await fetch(url);
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "No se pudo cargar la información de turnos.");
  return result;
}

function renderTurn(current) {
  turnCode.textContent = current ? `TURNO: A${String(current.number).padStart(3, "0")}` : "TURNO: ---";
  turnName.textContent = current ? current.nombre.toLocaleUpperCase("es") : "NO HAY TURNOS";
  turnPosition.textContent = current ? current.puesto.toLocaleUpperCase("es") : "";
}

async function refreshDisplay() {
  if (isRefreshing) return;
  isRefreshing = true;
  try {
    const result = await getJson("/api/current-turn");
    renderTurn(result.current);
    statusMessage.textContent = "";
    statusMessage.classList.remove("error");
  } catch (error) {
    statusMessage.textContent = error.message;
    statusMessage.classList.add("error");
  } finally {
    isRefreshing = false;
  }
}

refreshDisplay();
window.setInterval(refreshDisplay, 3000);
