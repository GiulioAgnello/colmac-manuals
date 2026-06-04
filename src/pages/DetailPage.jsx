import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import Header from "../components/Header";

const LANGS = [
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "pt", label: "Português", flag: "🇵🇹" },
];

const TIPO_LABEL = {
  manuale: "Manuale d'uso",
  esploso: "Esploso",
};

const LINGUA_INFO = {
  it: { flag: "🇮🇹", label: "Italiano" },
  en: { flag: "🇬🇧", label: "English" },
  fr: { flag: "🇫🇷", label: "Français" },
  es: { flag: "🇪🇸", label: "Español" },
};

function FileRowIcon({ tipo }) {
  const isEsploso = tipo === "esploso";
  return (
    <svg width="20" height="24" viewBox="0 0 20 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="20" height="24" rx="2" fill={isEsploso ? "#fff8ec" : "#f4f4f4"} stroke={isEsploso ? "#F5A100" : "#d1d5db"} strokeWidth="1.5"/>
      <polyline points="13,0 13,6 20,6" fill={isEsploso ? "#F5A100" : "#d1d5db"} stroke="none"/>
      <path d="M13 0 L20 6" stroke={isEsploso ? "#F5A100" : "#d1d5db"} strokeWidth="1.5" fill="none"/>
      <line x1="3" y1="11" x2="17" y2="11" stroke={isEsploso ? "#F5A100" : "#9ca3af"} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="3" y1="15" x2="17" y2="15" stroke={isEsploso ? "#F5A100" : "#9ca3af"} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="3" y1="19" x2="11" y2="19" stroke={isEsploso ? "#F5A100" : "#9ca3af"} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

export default function DetailPage({ apiUrl }) {
  const { modelId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialLang = searchParams.get("lang");

  const [step, setStep] = useState(initialLang ? "docs" : "lang");
  const [selectedLang, setSelectedLang] = useState(initialLang);

  const [manuale, setManuale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lineaImage, setLineaImage] = useState(null);

  useEffect(() => {
    const doFetch = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${apiUrl}?q=${encodeURIComponent(modelId)}&per_page=1`,
        );
        if (!res.ok) throw new Error();
        const data = await res.json();
        const found = data.find((m) => m.model_id === modelId);
        if (!found) throw new Error("not_found");
        setManuale(found);
      } catch (err) {
        setError(
          err.message === "not_found"
            ? `Nessun manuale trovato per il modello "${modelId}".`
            : "Errore nel caricamento. Riprova più tardi.",
        );
      } finally {
        setLoading(false);
      }
    };
    doFetch();
  }, [apiUrl, modelId]);

  // Carica immagine linea una volta noto manuale.linea
  useEffect(() => {
    if (!manuale?.linea) return;
    fetch(`/wp-json/wp/v2/colmac_linea?slug=${manuale.linea}`)
      .then((r) => r.json())
      .then((data) => {
        if (data[0]?.meta?.colmac_linea_image)
          setLineaImage(data[0].meta.colmac_linea_image);
      })
      .catch(() => {});
  }, [manuale]);

  return (
    <>
      <Header />

      <div className="containerBackLine">
        <button
          className="cm-back-btn"
          onClick={() => {
            if (step === "docs") {
              setStep("lang");
            } else if (manuale?.linea) {
              navigate(`/linea/${manuale.linea}`);
            } else {
              navigate(-1);
            }
          }}
        >
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
          {lineaImage && (
            <img
              src={lineaImage}
              alt={manuale?.linea || ""}
              className="cm-linea-banner__img"
            />
          )}
        </div>
      </div>

      <div className="cm-main">
        {loading && (
          <div className="cm-detail-loading">
            <div className="cm-spinner-lg" />
          </div>
        )}

        {!loading && error && (
          <div className="cm-detail-error">
            <p className="cm-error">{error}</p>
            <button className="cm-btn-back" onClick={() => navigate("/")}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Torna alla ricerca
            </button>
          </div>
        )}

        {/* ── STEP: LINGUA ── */}
        {!loading && manuale && step === "lang" && (
          <div className="cm-step-wrap">
            <p className="cm-step-title">Seleziona la lingua</p>
            <div className="cm-lang-grid">
              {LANGS.map((lang) => (
                <button
                  key={lang.code}
                  className="cm-lang-tile"
                  onClick={() => {
                    setSelectedLang(lang.code);
                    setStep("docs");
                  }}
                >
                  <span className="cm-lang-tile__flag">{lang.flag}</span>
                  <span className="cm-lang-tile__label">{lang.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP: DOCUMENTI ── */}
        {!loading && manuale && step === "docs" && (
          <>
            {(() => {
              const docs = selectedLang
                ? (manuale.documenti || []).filter(
                    (d) => d.lingua === selectedLang,
                  )
                : manuale.documenti || [];

              if (docs.length === 0)
                return (
                  <p className="cm-detail__empty">
                    Nessun documento disponibile.
                  </p>
                );

              return (
                <div className="cm-doc-folder">
                  <div className="cm-doc-folder__header">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                    </svg>
                    <span>
                      {docs.length}{" "}
                      {docs.length === 1
                        ? "documento disponibile"
                        : "documenti disponibili"}
                    </span>
                  </div>
                  <div className="cm-doc-folder__list">
                    {docs.map((doc, i) => {
                      const lingua = LINGUA_INFO[doc.lingua] || {
                        flag: "🌐",
                        label: (doc.lingua || "").toUpperCase(),
                      };
                      const tipoLabel =
                        TIPO_LABEL[doc.tipo] || doc.tipo || "Documento";
                      return (
                        <a
                          key={i}
                          href={doc.url || undefined}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`cm-doc-row${!doc.url ? " cm-doc-row--no-url" : ""}`}
                        >
                          <div className="cm-doc-row__icon">
                            <FileRowIcon tipo={doc.tipo} />
                          </div>
                          <div className="cm-doc-row__info">
                            <span className="cm-doc-row__tipo">{tipoLabel}</span>
                            <span className="cm-doc-row__lang">
                              <span className="cm-doc-row__flag">{lingua.flag}</span>
                              {lingua.label}
                            </span>
                          </div>
                          <div className="cm-doc-row__action">
                            <svg
                              width="15"
                              height="15"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="7 10 12 15 17 10" />
                              <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            <span>Scarica</span>
                          </div>
                        </a>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </>
        )}
      </div>
    </>
  );
}
