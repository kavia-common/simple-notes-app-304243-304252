import React from "react";
import { getClientInfo } from "../services/api";

/**
 * PUBLIC_INTERFACE
 * @param {{title: string}} props
 */
export default function Header({ title }) {
  const info = getClientInfo();

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
          <div className={`rb-pill ${info.mode === "api" ? "rb-pill--success" : "rb-pill--secondary"}`}>
            {info.mode === "api" ? "Connected" : "Mock mode"}
          </div>
        </div>
      </div>
    </div>
  );
}
