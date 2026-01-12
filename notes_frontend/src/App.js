import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import NoteEditor from "./components/NoteEditor";
import { createNote, deleteNote, listNotes, updateNote } from "./services/api";
import useDebouncedValue from "./hooks/useDebouncedValue";

/** @typedef {import('./types/note.js').Note} Note */

function normalizeError(e) {
  if (e && typeof e === "object" && "message" in e) return String(e.message);
  return "Unexpected error.";
}

function normalizeForSearch(s) {
  return String(s ?? "").toLowerCase();
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

  // Search query (debounced to avoid excessive re-rendering while typing).
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebouncedValue(searchQuery, 250);

  // Used to prevent race conditions if refresh is triggered multiple times.
  const loadSeq = useRef(0);

  const selectedNote = useMemo(() => notes.find((n) => n.id === selectedId) || null, [notes, selectedId]);

  const filteredNotes = useMemo(() => {
    const q = normalizeForSearch(debouncedQuery).trim();
    if (!q) return notes;

    return notes.filter((n) => {
      const hay = `${normalizeForSearch(n.title)}\n${normalizeForSearch(n.content)}`;
      return hay.includes(q);
    });
  }, [notes, debouncedQuery]);

  const selectedOutsideResults = useMemo(() => {
    if (!selectedId) return false;
    const q = normalizeForSearch(debouncedQuery).trim();
    if (!q) return false; // no filtering
    return !filteredNotes.some((n) => n.id === selectedId);
  }, [selectedId, debouncedQuery, filteredNotes]);

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

  // If user is filtering and the current selection disappears (e.g., due to deletion or refresh),
  // gracefully pick the first filtered note if available. If it's only filtered out by search,
  // we preserve selection and keep the editor visible.
  useEffect(() => {
    if (loading || listError) return;
    if (!selectedId) {
      setSelectedId(filteredNotes[0]?.id ?? null);
      return;
    }
    if (notes.length > 0 && !notes.some((n) => n.id === selectedId)) {
      setSelectedId(filteredNotes[0]?.id ?? notes[0]?.id ?? null);
    }
  }, [filteredNotes, notes, selectedId, loading, listError]);

  const handleSelect = useCallback((id) => setSelectedId(id), []);

  const handleCreate = useCallback(async () => {
    // Optimistic-ish: create immediately through client, then refresh list state with result.
    try {
      const note = await createNote({ title: "New note", content: "" });
      setNotes((prev) => [note, ...prev]);
      setSelectedId(note.id);

      // If user is searching, consider clearing it so the new note is visible,
      // but do NOT force-clearing (requirements say preserve CRUD behavior).
      // We keep the query as-is.
    } catch (e) {
      setListError(normalizeError(e));
    }
  }, []);

  const handleSave = useCallback(
    async (id, input) => {
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
    },
    [notes]
  );

  const handleDelete = useCallback(
    async (id) => {
      // Optimistic delete with fallback.
      const snapshot = notes;
      const nextNotes = snapshot.filter((n) => n.id !== id);

      setNotes(nextNotes);
      setSelectedId((prev) => {
        if (prev !== id) return prev;

        // Prefer first filtered note (if currently searching), otherwise first in list.
        const q = normalizeForSearch(debouncedQuery).trim();
        if (q) {
          const nextFiltered = nextNotes.filter((n) => {
            const hay = `${normalizeForSearch(n.title)}\n${normalizeForSearch(n.content)}`;
            return hay.includes(q);
          });
          return nextFiltered[0]?.id ?? nextNotes[0]?.id ?? null;
        }

        return nextNotes[0]?.id ?? null;
      });

      try {
        await deleteNote(id);
      } catch (e) {
        setNotes(snapshot);
        setSelectedId(id);
        throw e;
      }
    },
    [notes, debouncedQuery]
  );

  return (
    <div className="rb-app">
      <Header title="Rainbow Notes" searchQuery={searchQuery} onSearchQueryChange={setSearchQuery} />
      <div className="rb-shell">
        <Sidebar
          notes={filteredNotes}
          selectedId={selectedId}
          loading={loading}
          error={listError}
          onSelect={handleSelect}
          onCreate={handleCreate}
          onRetry={refresh}
          searchQuery={debouncedQuery}
          selectedOutsideResults={selectedOutsideResults}
        />
        <NoteEditor note={selectedNote} onSave={handleSave} onDelete={handleDelete} />
      </div>
    </div>
  );
}
