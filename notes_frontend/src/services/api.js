/**
 * Notes API client.
 * - If REACT_APP_API_BASE (or REACT_APP_BACKEND_URL) is set, uses REST endpoints:
 *   GET /notes, POST /notes, PUT /notes/:id, DELETE /notes/:id
 * - If neither is set, uses an in-memory mock store (session-only; no localStorage).
 */

/** @typedef {import('../types/note.js').Note} Note */

/** @returns {string|undefined} */
function getApiBaseUrl() {
  const raw =
    (typeof process !== "undefined" && process.env && process.env.REACT_APP_API_BASE) ||
    (typeof process !== "undefined" && process.env && process.env.REACT_APP_BACKEND_URL) ||
    "";
  const trimmed = String(raw || "").trim();
  return trimmed ? trimmed.replace(/\/+$/, "") : undefined;
}

/** @returns {string} */
function newId() {
  // Avoid extra deps; good enough for client-side note ids in mock mode.
  return `note_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

/** @returns {string} */
function nowIso() {
  return new Date().toISOString();
}

/**
 * Mock in-memory store lives at module scope.
 * This persists for the current SPA session only.
 * @type {Note[]}
 */
let mockNotes = [
  {
    id: newId(),
    title: "Welcome to Rainbow Notes",
    content:
      "This is a demo note stored in memory.\n\nSet REACT_APP_API_BASE (or REACT_APP_BACKEND_URL) to connect to a backend.",
    updatedAt: nowIso(),
  },
];

class HttpError extends Error {
  /**
   * @param {number} status
   * @param {string} message
   */
  constructor(status, message) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

/**
 * @param {string} path
 * @param {RequestInit} init
 * @returns {Promise<any>}
 */
async function requestJson(path, init = {}) {
  const base = getApiBaseUrl();
  if (!base) {
    throw new Error("API base URL not configured.");
  }

  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

  // For DELETE, many APIs return 204.
  if (res.status === 204) return null;

  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!res.ok) {
    const msg =
      (json && (json.error || json.message)) ||
      text ||
      `Request failed with status ${res.status}`;
    throw new HttpError(res.status, msg);
  }

  return json;
}

function asNote(raw) {
  const id = String(raw?.id ?? "");
  const title = String(raw?.title ?? "");
  const content = String(raw?.content ?? "");
  const updatedAt = String(raw?.updatedAt ?? nowIso());
  return { id, title, content, updatedAt };
}

/**
 * PUBLIC_INTERFACE
 * @returns {Promise<Note[]>}
 */
export async function listNotes() {
  const base = getApiBaseUrl();
  if (!base) {
    // mock
    return [...mockNotes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  const data = await requestJson("/notes", { method: "GET" });
  if (!Array.isArray(data)) return [];
  return data.map(asNote).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/**
 * PUBLIC_INTERFACE
 * @param {{title: string, content: string}} input
 * @returns {Promise<Note>}
 */
export async function createNote(input) {
  const base = getApiBaseUrl();
  if (!base) {
    const note = {
      id: newId(),
      title: String(input?.title ?? ""),
      content: String(input?.content ?? ""),
      updatedAt: nowIso(),
    };
    mockNotes = [note, ...mockNotes];
    return note;
  }

  const data = await requestJson("/notes", {
    method: "POST",
    body: JSON.stringify({ title: input.title, content: input.content }),
  });
  return asNote(data);
}

/**
 * PUBLIC_INTERFACE
 * @param {string} id
 * @param {{title: string, content: string}} input
 * @returns {Promise<Note>}
 */
export async function updateNote(id, input) {
  const base = getApiBaseUrl();
  if (!base) {
    const updatedAt = nowIso();
    mockNotes = mockNotes.map((n) =>
      n.id === id
        ? { ...n, title: String(input?.title ?? ""), content: String(input?.content ?? ""), updatedAt }
        : n
    );
    const found = mockNotes.find((n) => n.id === id);
    if (!found) throw new Error("Note not found.");
    return found;
  }

  const data = await requestJson(`/notes/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify({ title: input.title, content: input.content }),
  });
  return asNote(data);
}

/**
 * PUBLIC_INTERFACE
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteNote(id) {
  const base = getApiBaseUrl();
  if (!base) {
    mockNotes = mockNotes.filter((n) => n.id !== id);
    return;
  }

  await requestJson(`/notes/${encodeURIComponent(id)}`, { method: "DELETE" });
}

/**
 * PUBLIC_INTERFACE
 * @returns {{baseUrl?: string, mode: "api"|"mock"}}
 */
export function getClientInfo() {
  const baseUrl = getApiBaseUrl();
  return { baseUrl, mode: baseUrl ? "api" : "mock" };
}
