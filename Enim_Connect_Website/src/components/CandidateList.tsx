import { type Candidat, type Annonce, api } from "../api/client";

interface Props {
  annonce: Annonce | null;
  candidats: Candidat[];
  selectedId: string | null;
  onSelect: (c: Candidat) => void;
  loading: boolean;
}

const COLORS = [
  "from-primary to-secondary",
  "from-secondary to-purple-500",
  "from-tertiary to-teal-500",
  "from-orange-500 to-amber-400",
  "from-green-500 to-emerald-400",
];

function initiales(nom: string, prenom: string) {
  return `${prenom?.[0] ?? ""}${nom?.[0] ?? ""}`.toUpperCase();
}

export default function CandidateList({ annonce, candidats, selectedId, onSelect, loading }: Props) {
  if (!annonce) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-8 bg-surface">
        <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-3">arrow_back</span>
        <p className="font-semibold text-on-surface mb-1">Sélectionnez une offre</p>
        <p className="text-sm text-on-surface-variant">Choisissez une offre dans le panneau de gauche pour voir ses candidats.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-surface overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-surface/95 backdrop-blur-sm border-b border-outline-variant px-8 py-5">
        <h1 className="font-headline font-extrabold text-2xl text-on-surface mb-0.5 line-clamp-1">{annonce.titre}</h1>
        <p className="text-sm text-on-surface-variant">{annonce.departement} · {annonce.duree_mois ? `${annonce.duree_mois} mois` : "Durée non précisée"}</p>
      </div>

      <div className="px-8 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <span className="material-symbols-outlined text-3xl animate-spin text-on-surface-variant">progress_activity</span>
          </div>
        ) : candidats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-3">person_search</span>
            <p className="font-semibold text-on-surface mb-1">Aucun candidat pour l'instant</p>
            <p className="text-sm text-on-surface-variant">Les étudiants qui postuleront apparaîtront ici, triés par score IA.</p>
          </div>
        ) : (
          <>
            {/* AI summary */}
            <div className="mb-6 p-5 rounded-2xl bg-secondary/5 border border-secondary/20">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-secondary text-white rounded-xl flex-shrink-0">
                  <span className="material-symbols-outlined text-lg">auto_awesome</span>
                </div>
                <div>
                  <h3 className="font-semibold text-on-surface text-sm">Résumé IA</h3>
                  <p className="text-sm text-on-surface-variant mt-0.5">
                    <strong>{candidats.length}</strong> candidat{candidats.length > 1 ? "s" : ""} — classés par pertinence IA selon votre offre.
                    {candidats.length > 0 && candidats[0].description_cv && " Les profils avec CV analysé sont prioritaires."}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {candidats.map((c, i) => (
                <button
                  key={c.etudiant_id}
                  onClick={() => onSelect(c)}
                  className={`w-full text-left p-5 rounded-2xl border transition-all ${
                    selectedId === c.etudiant_id
                      ? "border-secondary bg-secondary/5 shadow-md"
                      : "border-outline-variant bg-surface-container-low hover:border-secondary/40 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${COLORS[i % COLORS.length]} flex items-center justify-center text-white font-bold flex-shrink-0`}>
                      {c.photo_url
                        ? <img src={api.photoUrl(c.photo_url)} className="w-full h-full rounded-xl object-cover" alt="" />
                        : initiales(c.nom, c.prenom)
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-on-surface">{c.prenom} {c.nom}</span>
                        {i === 0 && (
                          <span className="text-xs font-bold bg-secondary text-white px-2 py-0.5 rounded-lg">Top match</span>
                        )}
                      </div>
                      <p className="text-sm text-on-surface-variant">
                        {c.filiere ?? c.niveau ?? "Étudiant ENSMR"}
                        {c.niveau && c.filiere ? ` · ${c.niveau}` : ""}
                      </p>
                      {c.competences.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {c.competences.slice(0, 4).map((s) => (
                            <span key={s} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-lg">{s}</span>
                          ))}
                          {c.competences.length > 4 && (
                            <span className="text-xs text-on-surface-variant px-1">+{c.competences.length - 4}</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-on-surface-variant flex-shrink-0">
                      {new Date(c.date_candidature).toLocaleDateString("fr-FR")}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
