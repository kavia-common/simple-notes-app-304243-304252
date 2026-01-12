import React, { useEffect, useMemo, useState } from "react";

/** @typedef {import('../types/note.js').Note} Note */

/**
 * PUBLIC_INTERFACE
 * @param {{
 *  note: Note|null,
 *  onSave: (id: string, input: {title: string, content: string}) => Promise<void>,
 *  onDelete: (id: string) => Promise<void>
 * }} props
 */
export default function NoteEditor({ note, onSave, onDelete }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const [saveState, setSaveState] = useState("idle"); // idle|saving|saved|error
  const [error, setError] = useState(null);

  const noteId = note?.id ?? null;

  useEffect(() => {
    // When selection changes, reset form to note values.
    setTitle(note?.title ?? "");
    setContent(note?.content ?? "");
    setSaveState("idle");
    setError(null);
  }, [noteId]);

  const isDirty = useMemo(() => {
    if (!note) return false;
    return title !== (note.title ?? "") || content !== (note.content ?? "");
  }, [note, title, content]);

  async function handleSave() {
    if (!note) return;
    setError(null);
    setSaveState("saving");
    try {
      await onSave(note.id, { title, content });
      setSaveState("saved");
      window.setTimeout(() => setSaveState("idle"), 900);
    } catch (e) {
      setSaveState("error");
      setError(e instanceof Error ? e.message : "Save failed.");
    }
  }

  async function handleDelete() {
    if (!note) return;
    setError(null);

    const titleLabel = (note.title || "Untitled").trim();
    const ok = window.confirm(`Delete “${titleLabel}”? This cannot be undone.`);
    if (!ok) return;

    try {
      await onDelete(note.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed.");
    }
  }

  if (!note) {
    return (
      <main className="rb-main" aria-label="Note editor">
        <div className="rb-main__empty">
          <div className="rb-main__emptyTitle">Select a note</div>
          <div className="rb-main__emptyBody">Pick a note from the sidebar, or create a new one.</div>
        </div>
      </main>
    );
  }

  return (
    <main className="rb-main" aria-label="Note editor">
      <div className="rb-editor">
        <div className="rb-editor__toolbar">
          <div className="rb-editor__left">
            <div className="rb-pill rb-pill--neutral">
              Updated {new Date(note.updatedAt).toLocaleString()}
            </div>
            {isDirty ? <div className="rb-pill rb-pill--warning">Unsaved changes</div> : null}
          </div>

          <div className="rb-editor__right">
            <button className="rb-btn rb-btn--danger" onClick={handleDelete}>
              Delete
            </button>
            <button
              className="rb-btn rb-btn--primary"
              onClick={handleSave}
              disabled={!isDirty || saveState === "saving"}
            >
              {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : "Save"}
            </button>
          </div>
        </div>

        {error ? (
          <div className="rb-alert rb-alert--error" role="alert">
            <div className="rb-alert__title">Something went wrong</div>
            <div className="rb-alert__body">{error}</div>
          </div>
        ) : null}

        <div className="rb-editor__form">
          <label className="rb-label" htmlFor="note-title">
            Title
          </label>
          <input
            id="note-title"
            className="rb-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled"
          />

          <label className="rb-label" htmlFor="note-content">
            Content
          </label>
          <textarea
            id="note-content"
            className="rb-textarea"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write something delightful…"
            rows={14}
          />
        </div>
      </div>
    </main>
  );
}
