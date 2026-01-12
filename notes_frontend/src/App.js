import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import NoteEditor from "./components/NoteEditor";
import { createNote, deleteNote, listNotes, updateNote } from "./services/api";

/** @typedef {import('./types/note.js').Note} Note */

function normalizeError(e) {
  if (e && typeof e === "object" && "message" in e) return String(e.message);
  return "Unexpected error.";
}

/**
 * PUBLIC_INTERFACE
 * Root application component for the notes app.
 */
export default function App() {
  const [notes, setNotes] = useState(/** @type {Note[]} */ ([]));
  const [selectedId, setSelectedId] = useState(/** @type {string|null} */ (null));
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState(null);

  // Used to prevent race conditions if refresh is triggered multiple times.
  const loadSeq = useRef(0);

  const selectedNote = useMemo(() => notes.find((n) => n.id === selectedId) || null, [notes, selectedId]);

  const refresh = useCallback(async () => {
    const seq = ++loadSeq.current;
    setLoading(true);
    setListError(null);
    try {
      const data = await listNotes();
      if (seq !== loadSeq.current) return; // stale response
      setNotes(data);
      setSelectedId((prev) => {
        if (prev && data.some((n) => n.id === prev)) return prev;
        return data[0]?.id ?? null;
      });
    } catch (e) {
      if (seq !== loadSeq.current) return;
      setListError(normalizeError(e));
    } finally {
      if (seq === loadSeq.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleSelect = useCallback((id) => setSelectedId(id), []);

  const handleCreate = useCallback(async () => {
    // Optimistic-ish: create immediately through client, then refresh list state with result.
    try {
      const note = await createNote({ title: "New note", content: "" });
      setNotes((prev) => [note, ...prev]);
      setSelectedId(note.id);
    } catch (e) {
      setListError(normalizeError(e));
    }
  }, []);

  const handleSave = useCallback(async (id, input) => {
    // Optimistic update with fallback.
    const snapshot = notes;
    const optimisticUpdatedAt = new Date().toISOString();

    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, title: input.title, content: input.content, updatedAt: optimisticUpdatedAt } : n))
    );

    try {
      const updated = await updateNote(id, input);
      setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
    } catch (e) {
      // revert & rethrow for editor to show inline error
      setNotes(snapshot);
      throw e;
    }
  }, [notes]);

  const handleDelete = useCallback(async (id) => {
    // Optimistic delete with fallback.
    const snapshot = notes;
    const nextNotes = snapshot.filter((n) => n.id !== id);

    setNotes(nextNotes);
    setSelectedId((prev) => {
      if (prev !== id) return prev;
      return nextNotes[0]?.id ?? null;
    });

    try {
      await deleteNote(id);
    } catch (e) {
      setNotes(snapshot);
      setSelectedId(id);
      throw e;
    }
  }, [notes]);

  return (
    <div className="rb-app">
      <Header title="Rainbow Notes" />
      <div className="rb-shell">
        <Sidebar
          notes={notes}
          selectedId={selectedId}
          loading={loading}
          error={listError}
          onSelect={handleSelect}
          onCreate={handleCreate}
          onRetry={refresh}
        />
        <NoteEditor note={selectedNote} onSave={handleSave} onDelete={handleDelete} />
      </div>
    </div>
  );
}
