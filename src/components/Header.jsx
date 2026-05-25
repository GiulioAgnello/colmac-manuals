import React from "react";
import { Link } from "react-router-dom";

export default function Header() {
  const logoSrc = window.colmacData?.logoUrl || "./assets/logo.png";

  return (
    <header className="cm-header">
      <Link
        to="/"
        className="cm-header__logo-link"
        aria-label="Torna alla home"
      >
        <img
          src={logoSrc}
          alt="Colmac Italia"
          className="cm-header__logo"
          onError={(e) => (e.target.style.display = "none")}
        />
      </Link>
    </header>
  );
}
