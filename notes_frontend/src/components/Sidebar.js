import React from "react";

/** @typedef {import('../types/note.js').Note} Note */

/**
 * PUBLIC_INTERFACE
 * @param {{
 *  notes: Note[],
 *  selectedId: string|null,
 *  loading: boolean,
 *  error: string|null,
 *  onSelect: (id: string) => void,
 *  onCreate: () => void,
 *  onRetry: () => void,
 *  searchQuery?: string,
 *  selectedOutsideResults?: boolean
 * }} props
 */
export default function Sidebar({
  notes,
  selectedId,
  loading,
  error,
  onSelect,
  onCreate,
  onRetry,
  searchQuery = "",
  selectedOutsideResults = false,
}) {
  const hasQuery = Boolean(searchQuery && searchQuery.trim().length > 0);

  return (
    <aside className="rb-sidebar" aria-label="Notes">
      <div className="rb-sidebar__top">
        <div className="rb-sidebar__titleRow">
          <h2 className="rb-sidebar__title">Notes</h2>
          <button className="rb-btn rb-btn--primary" onClick={onCreate}>
            New
          </button>
        </div>

        {loading ? (
          <div className="rb-muted" role="status" aria-live="polite">
            Loading notes…
          </div>
        ) : error ? (
          <div className="rb-alert rb-alert--error" role="alert">
            <div className="rb-alert__title">Couldn’t load notes</div>
            <div className="rb-alert__body">{error}</div>
            <div className="rb-alert__actions">
              <button className="rb-btn rb-btn--secondary" onClick={onRetry}>
                Retry
              </button>
            </div>
          </div>
        ) : notes.length === 0 ? (
          hasQuery ? (
            <div className="rb-empty" role="status" aria-live="polite">
              <div className="rb-empty__title">No notes match your search</div>
              <div className="rb-empty__body">Try a different keyword or clear the search.</div>
              <button className="rb-btn rb-btn--secondary rb-btn--full" onClick={() => window.scrollTo(0, 0)}>
                Keep editing
              </button>
            </div>
          ) : (
            <div className="rb-empty">
              <div className="rb-empty__title">No notes yet</div>
              <div className="rb-empty__body">Create your first note to get started.</div>
              <button className="rb-btn rb-btn--primary rb-btn--full" onClick={onCreate}>
                Create a note
              </button>
            </div>
          )
        ) : selectedOutsideResults ? (
          <div className="rb-empty rb-empty--compact" role="status" aria-live="polite">
            <div className="rb-empty__title">Selected note is outside results</div>
            <div className="rb-empty__body">You can keep editing, or clear search to see it in the list.</div>
          </div>
        ) : null}
      </div>

      <div className="rb-sidebar__list" role="listbox" aria-label="Note list">
        {notes.map((n) => {
          const active = n.id === selectedId;
          const preview = (n.content || "").trim().slice(0, 80);
          const title = (n.title || "").trim() || "Untitled";
          return (
            <button
              key={n.id}
              className={`rb-noteRow ${active ? "rb-noteRow--active" : ""}`}
              onClick={() => onSelect(n.id)}
              role="option"
              aria-selected={active}
              title={title}
            >
              <div className="rb-noteRow__title">{title}</div>
              <div className="rb-noteRow__preview">{preview || "…"}</div>
              <div className="rb-noteRow__meta">{new Date(n.updatedAt).toLocaleString()}</div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
