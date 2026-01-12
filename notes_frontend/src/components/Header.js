import React from "react";
import { getClientInfo } from "../services/api";

/**
 * PUBLIC_INTERFACE
 * @param {{
 *  title: string,
 *  searchQuery?: string,
 *  onSearchQueryChange?: (next: string) => void
 * }} props
 */
export default function Header({ title, searchQuery = "", onSearchQueryChange = () => {} }) {
  const info = getClientInfo();
  const canClear = Boolean(searchQuery && searchQuery.trim().length > 0);

  return (
    <div className="rb-header" role="banner">
      <div className="rb-header__inner">
        <div className="rb-header__brand">
          <div className="rb-header__dot" aria-hidden="true" />
          <div className="rb-header__titleGroup">
            <div className="rb-header__title">{title}</div>
            <div className="rb-header__subtitle">Create, edit, and sparkle.</div>
          </div>
        </div>

        <div className="rb-header__right">
          <div className="rb-header__search" role="search">
            <label className="rb-srOnly" htmlFor="notes-search">
              Search notes
            </label>
            <div className="rb-search">
              <input
                id="notes-search"
                className="rb-search__input"
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                placeholder="Search notes…"
                autoComplete="off"
              />
              {canClear ? (
                <button
                  type="button"
                  className="rb-search__clear"
                  onClick={() => onSearchQueryChange("")}
                  aria-label="Clear search"
                  title="Clear search"
                >
                  ×
                </button>
              ) : null}
            </div>
          </div>

          <div className={`rb-pill ${info.mode === "api" ? "rb-pill--success" : "rb-pill--secondary"}`}>
            {info.mode === "api" ? "Connected" : "Mock mode"}
          </div>
        </div>
      </div>
    </div>
  );
}
