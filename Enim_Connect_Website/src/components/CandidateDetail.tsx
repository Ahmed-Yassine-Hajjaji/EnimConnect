import { useState } from "react";
import { type Candidat, api } from "../api/client";

interface Props {
  candidat: Candidat | null;
}

const COLORS = [
  "from-primary to-secondary",
  "from-secondary to-purple-500",
  "from-tertiary to-teal-500",
];

function initiales(nom: string, prenom: string) {
  return `${prenom?.[0] ?? ""}${nom?.[0] ?? ""}`.toUpperCase();
}

export default function CandidateDetail({ candidat: c }: Props) {
  const [downloadingCv, setDownloadingCv] = useState(false);
  if (!c) {
    return (
      <aside className="w-96 bg-surface-container-low border-l border-outline-variant flex flex-col items-center justify-center text-center px-8">
        <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-3">person</span>
        <p className="font-semibold text-on-surface mb-1">Aucun candidat sélectionné</p>
        <p className="text-sm text-on-surface-variant">Cliquez sur un candidat dans la liste pour voir son profil.</p>
      </aside>
    );
  }

  const fullName = `${c.prenom} ${c.nom}`;

  return (
    <aside className="w-96 bg-surface-container-low border-l border-outline-variant overflow-y-auto flex flex-col flex-shrink-0">
      {/* Avatar + name */}
      <div className="p-7 pb-0">
        <div className="flex items-start gap-4 mb-5">
          <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${COLORS[0]} flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 shadow-lg`}>
            {c.photo_url
              ? <img src={api.photoUrl(c.photo_url)} className="w-full h-full rounded-2xl object-cover" alt="" />
              : initiales(c.nom, c.prenom)
            }
          </div>
          <div className="flex-1 min-w-0 pt-1">
            <h2 className="font-headline font-black text-xl text-on-surface leading-tight">{fullName}</h2>
            <p className="text-sm text-secondary font-medium mt-0.5">
              {c.filiere ?? "Étudiant ENSMR"}
              {c.niveau ? ` · ${c.niveau}` : ""}
            </p>
            <p className="text-xs text-on-surface-variant mt-1">{c.email}</p>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          {c.niveau && (
            <span className="px-3 py-1 bg-surface text-xs font-semibold rounded-full border border-outline-variant">{c.niveau}</span>
          )}
          <span className="px-3 py-1 bg-surface text-xs font-semibold rounded-full border border-outline-variant">
            Candidature : {new Date(c.date_candidature).toLocaleDateString("fr-FR")}
          </span>
        </div>
      </div>

      <div className="px-7 pb-7 flex-1 space-y-5">
        {/* AI analysis */}
        {c.description_cv ? (
          <div className="bg-surface rounded-2xl p-5 border border-outline-variant">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-secondary text-lg">auto_awesome</span>
              <h3 className="font-semibold text-on-surface text-sm">Analyse IA du CV</h3>
            </div>
            <p className="text-sm text-on-surface-variant leading-relaxed">{c.description_cv}</p>
          </div>
        ) : (
          <div className="bg-surface rounded-2xl p-4 border border-dashed border-outline-variant text-center">
            <span className="material-symbols-outlined text-2xl text-on-surface-variant mb-1 block">description</span>
            <p className="text-xs text-on-surface-variant">Pas encore de CV analysé par l'IA</p>
          </div>
        )}

        {/* Skills */}
        {c.competences.length > 0 && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Compétences</h3>
            <div className="flex flex-wrap gap-2">
              {c.competences.map((s) => (
                <span key={s} className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-lg font-medium">{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* Filière */}
        {c.filiere && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Filière</h3>
            <p className="text-sm text-on-surface">{c.filiere}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-6 border-t border-outline-variant space-y-2.5">
        {c.cv_url && (
          <button
            onClick={async () => {
              setDownloadingCv(true);
              try {
                await api.downloadCV(c.etudiant_id, `cv_${c.prenom}_${c.nom}.pdf`);
              } catch {
                // silent — file simply not available
              } finally {
                setDownloadingCv(false);
              }
            }}
            disabled={downloadingCv}
            className="w-full flex items-center justify-center gap-2 py-3 px-5 border-2 border-primary text-primary font-semibold rounded-xl hover:bg-primary/5 transition-colors text-sm disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-base">{downloadingCv ? "progress_activity" : "download"}</span>
            {downloadingCv ? "Téléchargement…" : "Télécharger le CV"}
          </button>
        )}
        <a
          href={`mailto:${c.email}`}
          className="w-full flex items-center justify-center gap-2 py-3 px-5 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl hover:opacity-90 transition-opacity text-sm shadow-md"
        >
          <span className="material-symbols-outlined text-base">mail</span>
          Contacter {c.prenom}
        </a>
      </div>
    </aside>
  );
}
