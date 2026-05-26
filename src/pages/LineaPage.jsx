import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import SearchBar from "../components/SearchBar";
import EmptyState from "../components/EmptyState";
import Header from "../components/Header";

const LANGS = [
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "pt", label: "Português", flag: "🇵🇹" },
];

function DocTypeIcon({ tipo }) {
  if (tipo === "esploso") {
    return (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect
          x="12"
          y="8"
          width="40"
          height="6"
          rx="2"
          fill="#F5A623"
          opacity="0.9"
        />
        <rect
          x="12"
          y="20"
          width="40"
          height="6"
          rx="2"
          fill="#F5A623"
          opacity="0.6"
        />
        <rect
          x="12"
          y="32"
          width="40"
          height="6"
          rx="2"
          fill="#F5A623"
          opacity="0.4"
        />
        <rect
          x="12"
          y="44"
          width="40"
          height="6"
          rx="2"
          fill="#F5A623"
          opacity="0.2"
        />
        <line
          x1="32"
          y1="4"
          x2="32"
          y2="60"
          stroke="#F5A623"
          strokeWidth="1.5"
          strokeDasharray="3 3"
          opacity="0.4"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect
        x="10"
        y="6"
        width="44"
        height="52"
        rx="3"
        fill="#f0f0f0"
        stroke="#ddd"
        strokeWidth="1.5"
      />
      <rect
        x="10"
        y="6"
        width="8"
        height="52"
        rx="3"
        fill="#F5A623"
        opacity="0.8"
      />
      <line
        x1="24"
        y1="18"
        x2="48"
        y2="18"
        stroke="#ccc"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="24"
        y1="26"
        x2="48"
        y2="26"
        stroke="#ccc"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="24"
        y1="34"
        x2="48"
        y2="34"
        stroke="#ccc"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="24"
        y1="42"
        x2="40"
        y2="42"
        stroke="#ccc"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function LineaPage({ apiUrl }) {
  const { lineaId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialLang = searchParams.get("lang");

  const [step, setStep] = useState(initialLang ? "results" : "lang");
  const [selectedLang, setSelectedLang] = useState(initialLang);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);
  const [sortAsc, setSortAsc] = useState(true);
  const [lineaLabel, setLineaLabel] = useState(lineaId);
  const [lineaImage, setLineaImage] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [bannerHeight, setBannerHeight] = useState(0);
  const bannerRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Misura altezza banner per il spacer — solo quando l'immagine carica,
  // NON su ogni scroll (evita race condition con la transizione CSS 0.3s)
  useEffect(() => {
    if (!bannerRef.current) return;
    // Aspetta che la transizione sia finita prima di misurare
    const t = setTimeout(() => {
      if (bannerRef.current) {
        setBannerHeight(bannerRef.current.offsetHeight);
      }
    }, 50);
    return () => clearTimeout(t);
  }, [lineaImage]);

  // Recupera nome + immagine della linea dalla REST API
  useEffect(() => {
    fetch(`/wp-json/wp/v2/colmac_linea?slug=${lineaId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data[0]?.name) setLineaLabel(data[0].name);
        if (data[0]?.meta?.colmac_linea_image)
          setLineaImage(data[0].meta.colmac_linea_image);
      })
      .catch(() => {});
  }, [lineaId]);

  const fetchResults = useCallback(
    async (lang) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ linea: lineaId, lang });
        const res = await fetch(`${apiUrl}?${params.toString()}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setResults(data);
        setSearched(true);
      } catch {
        setError("Impossibile caricare i risultati. Riprova più tardi.");
      } finally {
        setLoading(false);
      }
    },
    [apiUrl, lineaId],
  );

  useEffect(() => {
    if (initialLang) fetchResults(initialLang);
  }, [fetchResults]);

  const handleLangClick = (lang) => {
    setSelectedLang(lang);
    setStep("results");
    fetchResults(lang);
  };

  const goBack = () => {
    if (step === "results") {
      setStep("lang");
      setSelectedLang(null);
      setResults([]);
      setSearched(false);
    } else {
      navigate("/");
    }
  };

  const selectedLangObj = LANGS.find((l) => l.code === selectedLang);

  return (
    <>
      <Header />
      <div className="containerBackLine">
        <button className="cm-back-btn" onClick={goBack} aria-label="Indietro">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className="cm-linea-banner__media">
          {lineaImage ? (
            <img
              src={lineaImage}
              alt={lineaLabel}
              className="cm-linea-banner__img"
            />
          ) : null}
        </div>
      </div>

      <div className="cm-main">
        {/* ── STEP: LINGUA ── */}
        {step === "lang" && (
          <div className="cm-step-wrap">
            <p className="cm-step-title">Seleziona la lingua</p>
            <div className="cm-lang-grid">
              {LANGS.map((lang) => (
                <button
                  key={lang.code}
                  className="cm-lang-tile"
                  onClick={() => handleLangClick(lang.code)}
                >
                  <span className="cm-lang-tile__flag">{lang.flag}</span>
                  <span className="cm-lang-tile__label">{lang.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP: RISULTATI ── */}
        {step === "results" && (
          <>
            {error && <p className="cm-error">{error}</p>}

            {loading && (
              <div className="cm-detail-loading">
                <div className="cm-spinner-lg" />
              </div>
            )}

            {!loading && searched && results.length === 0 && !error && (
              <EmptyState />
            )}

            {results.length > 0 && (
              <div className="cm-results-wrap">
                <div className="cm-results-count">
                  {
                    [...results].sort((a, b) => {
                      const n = (s) =>
                        ((s || "").match(/(\d+)/) || [0, 0])[1] * 1;
                      return sortAsc
                        ? n(a.model_id) - n(b.model_id)
                        : n(b.model_id) - n(a.model_id);
                    }).length
                  }{" "}
                  {results.length === 1 ? "modello trovato" : "modelli trovati"}
                  <button
                    className="cm-sort-toggle"
                    onClick={() => setSortAsc((s) => !s)}
                    title={
                      sortAsc
                        ? "Crescente. Clicca per invertire"
                        : "Decrescente. Clicca per invertire"
                    }
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      {sortAsc ? (
                        <polyline points="12 5 12 19 5 12" />
                      ) : (
                        <polyline points="12 19 12 5 19 12" />
                      )}
                    </svg>
                    {sortAsc ? "Crescente" : "Decrescente"}
                  </button>
                </div>
                <div className="cm-results">
                  {[...results]
                    .sort((a, b) => {
                      const n = (s) =>
                        ((s || "").match(/(\d+)/) || [0, 0])[1] * 1;
                      return sortAsc
                        ? n(a.model_id) - n(b.model_id)
                        : n(b.model_id) - n(a.model_id);
                    })
                    .map((item) => (
                      <div
                        key={item.id}
                        className="cm-result-card"
                        onClick={() =>
                          navigate(`/m/${item.model_id}?lang=${selectedLang}`)
                        }
                      >
                        <div className="cm-result-card__icon-wrap">
                          {item.photo ? (
                            <img
                              src={item.photo}
                              alt={item.nome}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "contain",
                                borderRadius: "4px",
                                display: "block",
                                background: "#fafafa",
                              }}
                            />
                          ) : (
                            <DocTypeIcon tipo={item.documenti?.[0]?.tipo} />
                          )}
                        </div>
                        <div className="cm-result-card__top">
                          <span className="cm-result-card__model">
                            {item.model_id}
                          </span>
                          <svg
                            className="cm-result-card__arrow"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                          >
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
