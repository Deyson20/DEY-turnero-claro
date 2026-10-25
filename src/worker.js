const textEncoder = new TextEncoder();
const sessionCookieName = "turnero_session";
const sessionLifetimeSeconds = 60 * 60 * 24 * 7;
const adminCookieName = "turnero_admin";
const adminSessionLifetimeSeconds = 60 * 60 * 8;

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...headers,
    },
  });
}

function encodeBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function decodeBase64Url(value) {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
  const binary = atob(base64 + "=".repeat((4 - (base64.length % 4)) % 4));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function signingKey(env) {
  const secret = env.SESSION_SECRET;
  if (typeof secret !== "string" || secret.length === 0) {
    throw new Error("SESSION_SECRET no está configurado en el entorno activo.");
  }
  if (secret.length < 32) {
    throw new Error(`SESSION_SECRET debe tener al menos 32 caracteres; se recibieron ${secret.length}.`);
  }

  return crypto.subtle.importKey(
    "raw",
    textEncoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function signSession(session, env) {
  const payload = encodeBase64Url(textEncoder.encode(JSON.stringify(session)));
  const signature = await crypto.subtle.sign("HMAC", await signingKey(env), textEncoder.encode(payload));
  return `${payload}.${encodeBase64Url(new Uint8Array(signature))}`;
}

async function readSession(request, env) {
  const cookie = request.headers.get("Cookie") || "";
  const value = cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${sessionCookieName}=`))
    ?.slice(sessionCookieName.length + 1);

  if (!value) return null;

  try {
    const [payload, signature, extra] = value.split(".");
    if (!payload || !signature || extra !== undefined) return null;

    const valid = await crypto.subtle.verify(
      "HMAC",
      await signingKey(env),
      decodeBase64Url(signature),
      textEncoder.encode(payload),
    );
    if (!valid) return null;

    const session = JSON.parse(new TextDecoder().decode(decodeBase64Url(payload)));
    if (
      !Number.isSafeInteger(session.index) ||
      session.index < 0 ||
      typeof session.csrf !== "string" ||
      !Number.isSafeInteger(session.exp) ||
      session.exp <= Date.now()
    ) {
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

function setSessionCookie(session, request) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${sessionCookieName}=${session.value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${sessionLifetimeSeconds}${secure}`;
}

async function createSession(request, env, index = 0, csrf = null) {
  const session = {
    index,
    csrf: csrf || encodeBase64Url(crypto.getRandomValues(new Uint8Array(32))),
    exp: Date.now() + sessionLifetimeSeconds * 1000,
  };
  return {
    session,
    cookie: setSessionCookie({ value: await signSession(session, env) }, request),
  };
}

async function requireCsrf(request, env) {
  const session = await readSession(request, env);
  const token = request.headers.get("X-CSRF-Token");
  if (!session || !token || token !== session.csrf) {
    return { response: json({ error: "Sesión inválida. Recarga la página e inténtalo de nuevo." }, 403) };
  }
  return { session };
}

function getCookie(request, name) {
  return (request.headers.get("Cookie") || "")
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1) || null;
}

async function readAdminSession(request, env) {
  const value = getCookie(request, adminCookieName);
  if (!value) return null;

  try {
    const [payload, signature, extra] = value.split(".");
    if (!payload || !signature || extra !== undefined) return null;
    const valid = await crypto.subtle.verify(
      "HMAC",
      await signingKey(env),
      decodeBase64Url(signature),
      textEncoder.encode(payload),
    );
    if (!valid) return null;

    const session = JSON.parse(new TextDecoder().decode(decodeBase64Url(payload)));
    if (typeof session.csrf !== "string" || !Number.isSafeInteger(session.exp) || session.exp <= Date.now()) {
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

async function createAdminSession(request, env) {
  const session = {
    csrf: encodeBase64Url(crypto.getRandomValues(new Uint8Array(32))),
    exp: Date.now() + adminSessionLifetimeSeconds * 1000,
  };
  const value = await signSession(session, env);
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return {
    session,
    cookie: `${adminCookieName}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${adminSessionLifetimeSeconds}${secure}`,
  };
}

async function requireAdminSession(request, env) {
  const session = await readAdminSession(request, env);
  if (!session) {
    return { response: json({ error: "Inicia sesión para continuar." }, 401) };
  }
  return { session };
}

async function requireAdminCsrf(request, env) {
  const admin = await requireAdminSession(request, env);
  if (admin.response) return admin;
  const { session } = admin;
  if (request.headers.get("X-Admin-CSRF-Token") !== session.csrf) {
    return { response: json({ error: "Sesión administrativa inválida. Inicia sesión de nuevo." }, 403) };
  }
  return { session };
}

async function equalSecret(value, expected) {
  const [left, right] = await Promise.all([
    crypto.subtle.digest("SHA-256", textEncoder.encode(value)),
    crypto.subtle.digest("SHA-256", textEncoder.encode(expected)),
  ]);
  const leftBytes = new Uint8Array(left);
  const rightBytes = new Uint8Array(right);
  let difference = 0;
  for (let index = 0; index < leftBytes.length; index += 1) {
    difference |= leftBytes[index] ^ rightBytes[index];
  }
  return difference === 0;
}

async function handleApi(request, env, url) {
  if (request.method === "POST" && url.pathname === "/api/auth/login") {
    let input;
    try {
      input = await request.json();
    } catch {
      return json({ error: "El cuerpo de la solicitud debe ser JSON válido." }, 400);
    }
    if (
      !input ||
      typeof input !== "object" ||
      Array.isArray(input) ||
      typeof input.username !== "string" ||
      typeof input.password !== "string" ||
      input.username.length > 120 ||
      input.password.length > 1024
    ) {
      return json({ error: "Escribe el usuario y la contraseña." }, 400);
    }
    if (
      typeof env.ADMIN_USERNAME !== "string" ||
      !env.ADMIN_USERNAME ||
      env.ADMIN_USERNAME.length > 120 ||
      typeof env.ADMIN_PASSWORD !== "string" ||
      env.ADMIN_PASSWORD.length < 12 ||
      env.ADMIN_PASSWORD.length > 1024
    ) {
      throw new Error("Configura ADMIN_USERNAME y una ADMIN_PASSWORD de al menos 12 caracteres.");
    }

    const [validUsername, validPassword] = await Promise.all([
      equalSecret(input.username, env.ADMIN_USERNAME),
      equalSecret(input.password, env.ADMIN_PASSWORD),
    ]);
    if (!validUsername || !validPassword) {
      return json({ error: "Usuario o contraseña incorrectos." }, 401);
    }

    const { session, cookie } = await createAdminSession(request, env);
    return json({ csrf: session.csrf }, 200, { "Set-Cookie": cookie });
  }

  if (request.method === "GET" && url.pathname === "/api/auth/session") {
    const session = await readAdminSession(request, env);
    if (!session) return json({ error: "Inicia sesión para continuar." }, 401);
    return json({ csrf: session.csrf });
  }

  if (request.method === "POST" && url.pathname === "/api/auth/logout") {
    const admin = await requireAdminCsrf(request, env);
    if (admin.response) return admin.response;
    const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
    return json(
      { message: "Sesión cerrada." },
      200,
      { "Set-Cookie": `${adminCookieName}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}` },
    );
  }

  if (request.method === "GET" && url.pathname === "/api/session") {
    const admin = await requireAdminSession(request, env);
    if (admin.response) return admin.response;
    const turn = await env.DB
      .prepare("SELECT current_person_id AS currentId FROM turnero_state WHERE id = 1")
      .first();
    if (!turn) throw new Error("No se encontró el estado inicial del turnero.");

    const currentId = turn.currentId === null ? null : Number(turn.currentId);
    const position = currentId === null
      ? { total: 0 }
      : await env.DB.prepare("SELECT COUNT(*) AS total FROM persona WHERE id < ?")
        .bind(currentId)
        .first();
    const current = await readSession(request, env);
    const index = Number(position.total);
    if (current && index === current.index) {
      return json({ csrf: current.csrf, index, currentId });
    }
    const { session, cookie } = await createSession(request, env, index);
    return json(
      { csrf: session.csrf, index: session.index, currentId },
      200,
      { "Set-Cookie": cookie },
    );
  }

  if (request.method === "GET" && url.pathname === "/api/current-turn") {
    const state = await env.DB
      .prepare("SELECT current_person_id AS currentId FROM turnero_state WHERE id = 1")
      .first();
    if (!state) throw new Error("No se encontró el estado inicial del turnero.");
    if (state.currentId === null) return json({ current: null });

    const turn = await env.DB
      .prepare(
        `SELECT id, nombre, puesto,
          (SELECT COUNT(*) FROM persona AS earlier WHERE earlier.id < persona.id) AS position
        FROM persona WHERE id = ?`,
      )
      .bind(state.currentId)
      .first();
    if (!turn) throw new Error("No se encontró la persona del turno actual.");
    return json({
      current: {
        number: Number(turn.position) + 1,
        nombre: turn.nombre,
        puesto: turn.puesto,
      },
    });
  }

  if (request.method === "GET" && url.pathname === "/api/people") {
    const admin = await requireAdminSession(request, env);
    if (admin.response) return admin.response;
    const result = await env.DB.prepare("SELECT id, nombre, puesto FROM persona ORDER BY id ASC").all();
    return json(result.results);
  }

  if (request.method === "POST" && url.pathname === "/api/people") {
    const admin = await requireAdminCsrf(request, env);
    if (admin.response) return admin.response;
    const csrf = await requireCsrf(request, env);
    if (csrf.response) return csrf.response;

    let input;
    try {
      input = await request.json();
    } catch {
      return json({ error: "El cuerpo de la solicitud debe ser JSON válido." }, 400);
    }
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      return json({ error: "El cuerpo de la solicitud debe ser un objeto JSON." }, 400);
    }

    const nombre = typeof input.nombre === "string" ? input.nombre.trim() : "";
    const puesto = typeof input.puesto === "string" ? input.puesto.trim() : "";
    if (!nombre || !puesto || nombre.length > 120 || puesto.length > 120) {
      return json({ error: "Nombre y puesto son obligatorios y deben tener máximo 120 caracteres." }, 400);
    }

    const result = await env.DB
      .prepare("INSERT INTO persona (nombre, puesto) VALUES (?, ?)")
      .bind(nombre, puesto)
      .run();
    await env.DB.prepare(
      "UPDATE turnero_state SET current_person_id = ? WHERE id = 1 AND current_person_id IS NULL",
    ).bind(result.meta.last_row_id).run();
    return json({ id: result.meta.last_row_id, nombre, puesto }, 201);
  }

  if (request.method === "DELETE" && url.pathname === "/api/people") {
    const admin = await requireAdminCsrf(request, env);
    if (admin.response) return admin.response;
    const csrf = await requireCsrf(request, env);
    if (csrf.response) return csrf.response;
    await env.DB.prepare("DELETE FROM persona").run();
    await env.DB.prepare("UPDATE turnero_state SET current_person_id = NULL WHERE id = 1").run();
    return json({ message: "Todos los registros eliminados." });
  }

  const personMatch = url.pathname.match(/^\/api\/people\/(\d+)$/);
  if (request.method === "DELETE" && personMatch) {
    const admin = await requireAdminCsrf(request, env);
    if (admin.response) return admin.response;
    const csrf = await requireCsrf(request, env);
    if (csrf.response) return csrf.response;

    const id = Number(personMatch[1]);
    if (!Number.isSafeInteger(id) || id < 1) return json({ error: "ID inválido." }, 400);
    const turn = await env.DB
      .prepare("SELECT current_person_id AS currentId FROM turnero_state WHERE id = 1")
      .first();
    if (!turn) throw new Error("No se encontró el estado inicial del turnero.");

    if (Number(turn.currentId) === id) {
      const next = await env.DB
        .prepare("SELECT id FROM persona WHERE id > ? ORDER BY id ASC LIMIT 1")
        .bind(id)
        .first();
      const replacement = next || await env.DB
        .prepare("SELECT id FROM persona WHERE id < ? ORDER BY id DESC LIMIT 1")
        .bind(id)
        .first();
      await env.DB.prepare("UPDATE turnero_state SET current_person_id = ? WHERE id = 1")
        .bind(replacement?.id ?? null)
        .run();
    }

    const result = await env.DB.prepare("DELETE FROM persona WHERE id = ?").bind(id).run();
    if (result.meta.changes === 0) return json({ error: "No se encontró la persona." }, 404);
    return json({ message: "Persona eliminada." });
  }

  if (request.method === "POST" && url.pathname === "/api/turn") {
    const admin = await requireAdminCsrf(request, env);
    if (admin.response) return admin.response;
    const csrf = await requireCsrf(request, env);
    if (csrf.response) return csrf.response;

    let input;
    try {
      input = await request.json();
    } catch {
      return json({ error: "El cuerpo de la solicitud debe ser JSON válido." }, 400);
    }
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      return json({ error: "El cuerpo de la solicitud debe ser un objeto JSON." }, 400);
    }
    if (input.direction !== "next" && input.direction !== "previous") {
      return json({ error: "Dirección de turno inválida." }, 400);
    }

    const turn = await env.DB
      .prepare("SELECT current_person_id AS currentId FROM turnero_state WHERE id = 1")
      .first();
    if (!turn) throw new Error("No se encontró el estado inicial del turnero.");

    const comparison = input.direction === "next" ? ">" : "<";
    const ordering = input.direction === "next" ? "ASC" : "DESC";
    const target = turn.currentId === null
      ? await env.DB.prepare("SELECT id FROM persona ORDER BY id ASC LIMIT 1").first()
      : await env.DB
        .prepare(`SELECT id FROM persona WHERE id ${comparison} ? ORDER BY id ${ordering} LIMIT 1`)
        .bind(turn.currentId)
        .first();
    const currentId = target ? Number(target.id) : turn.currentId === null ? null : Number(turn.currentId);
    if (target) {
      await env.DB.prepare("UPDATE turnero_state SET current_person_id = ? WHERE id = 1")
        .bind(currentId)
        .run();
    }
    const position = currentId === null
      ? { total: 0 }
      : await env.DB.prepare("SELECT COUNT(*) AS total FROM persona WHERE id < ?")
        .bind(currentId)
        .first();
    const index = Number(position.total);
    const { session, cookie } = await createSession(request, env, index, csrf.session.csrf);
    return json(
      { index: session.index, currentId, csrf: session.csrf },
      200,
      { "Set-Cookie": cookie },
    );
  }

  return json({ error: "Ruta no encontrada." }, 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (url.pathname.startsWith("/api/")) return await handleApi(request, env, url);
      if (
        ["/", "/index", "/index.html", "/turno", "/turno.html", "/app.js", "/turno.js"]
          .includes(url.pathname)
      ) {
        const session = await readAdminSession(request, env);
        if (!session) {
          return new Response(null, {
            status: 302,
            headers: {
              Location: "/login.html",
              "Cache-Control": "no-store",
            },
          });
        }
      }
      return await env.ASSETS.fetch(request);
    } catch (error) {
      console.error(
        "Error procesando la solicitud:",
        error instanceof Error ? error.message : String(error),
      );
      return json({ error: "Ocurrió un error interno. Revisa los registros del Worker." }, 500);
    }
  },
};
