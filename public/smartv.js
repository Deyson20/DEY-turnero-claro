const turnName = document.querySelector("#turn-name");
const turnPosition = document.querySelector("#turn-position");
const turnList = document.querySelector("#turn-list");
const statusMessage = document.querySelector("#status");
let isRefreshing = false;

async function getJson(url) {
  const response = await fetch(url);
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "No se pudo cargar la información de turnos.");
  return result;
}

function renderTurn(currentId, people) {
  const current = people.find((person) => person.id === currentId);
  turnName.textContent = current ? current.nombre.toLocaleUpperCase("es") : "NO HAY TURNOS";
  turnPosition.textContent = current ? current.puesto.toLocaleUpperCase("es") : "";

  turnList.replaceChildren();
  if (people.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "smart-tv-empty";
    emptyItem.textContent = "No hay turnos registrados.";
    turnList.append(emptyItem);
    return;
  }

  for (const person of people) {
    const item = document.createElement("li");
    item.className = "smart-tv-list-item";
    if (person.id === currentId) item.classList.add("is-current");

    const details = document.createElement("div");
    const name = document.createElement("span");
    name.className = "smart-tv-list-name";
    name.textContent = person.nombre;
    const position = document.createElement("span");
    position.className = "smart-tv-list-position";
    position.textContent = person.puesto;
    details.append(name, position);

    const label = document.createElement("span");
    label.className = "smart-tv-list-label";
    label.textContent = person.id === currentId ? "ACTUAL" : "";
    item.append(details, label);
    turnList.append(item);
  }
}

async function refreshDisplay() {
  if (isRefreshing) return;
  isRefreshing = true;
  try {
    const [session, people] = await Promise.all([getJson("/api/session"), getJson("/api/people")]);
    renderTurn(session.currentId, people);
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
