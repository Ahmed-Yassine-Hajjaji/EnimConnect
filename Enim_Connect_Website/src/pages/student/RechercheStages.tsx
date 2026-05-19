import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import { NOMS_DEPARTEMENTS } from "../../constants/ensmr";

interface Annonce {
  id: string;
  titre: string;
  description: string;
  departement: string;
  duree_mois: number | null;
  nom_entreprise: string | null;
  ville: string | null;
  created_at: string;
}

const DUREES = [
  { label: "1–2 mois", min: 1, max: 2 },
  { label: "3–4 mois", min: 3, max: 4 },
  { label: "5–6 mois", min: 5, max: 6 },
  { label: "6+ mois", min: 7, max: 99 },
];

export default function RechercheStages() {
  const [query, setQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState<string | null>(null);
  const [dureeFilter, setDureeFilter] = useState<string | null>(null);
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getAnnonces()
      .then((data) => setAnnonces(data as Annonce[]))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const activeDuree = DUREES.find((d) => d.label === dureeFilter) ?? null;

  const filtered = annonces.filter((a) => {
    const q = query.toLowerCase();
    const matchText =
      !q ||
      a.titre.toLowerCase().includes(q) ||
      (a.nom_entreprise ?? "").toLowerCase().includes(q) ||
      a.departement.toLowerCase().includes(q);
    const matchDept = !deptFilter || a.departement === deptFilter;
    const matchDuree =
      !activeDuree ||
      (a.duree_mois !== null &&
        a.duree_mois !== undefined &&
        a.duree_mois >= activeDuree.min &&
        a.duree_mois <= activeDuree.max);
    return matchText && matchDept && matchDuree;
  });

  return (
    <main className="min-h-screen">
      <div className="sticky top-16 z-10 bg-surface/90 backdrop-blur-md border-b border-outline-variant px-4 sm:px-6 lg:px-10 py-4 lg:py-5">
        <div className="max-w-5xl">
          <h1 className="font-headline font-bold text-2xl text-on-surface mb-4">
            Recherche de stages
          </h1>
          <div className="flex items-center gap-3 bg-surface-container-low border border-outline-variant rounded-2xl px-5 py-3.5 shadow-sm focus-within:border-primary transition-colors mb-3">
            <span className="material-symbols-outlined text-on-surface-variant text-2xl">search</span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Développeur, Data Science, département…"
              className="flex-1 bg-transparent text-base text-on-surface placeholder-on-surface-variant outline-none"
            />
            {query && (
              <button onClick={() => setQuery("")} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            )}
          </div>
          {/* Filter chips */}
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-on-surface-variant self-center font-medium">Département :</span>
            {NOMS_DEPARTEMENTS.map((d) => (
              <button
                key={d}
                onClick={() => setDeptFilter(deptFilter === d ? null : d)}
                className={`text-xs px-3 py-1.5 rounded-xl border font-medium transition-colors ${
                  deptFilter === d
                    ? "bg-primary text-white border-primary"
                    : "bg-surface-container border-outline-variant text-on-surface-variant hover:border-primary/50 hover:text-on-surface"
                }`}
              >
                {d}
              </button>
            ))}
            <span className="text-xs text-on-surface-variant self-center font-medium ml-2">Durée :</span>
            {DUREES.map((d) => (
              <button
                key={d.label}
                onClick={() => setDureeFilter(dureeFilter === d.label ? null : d.label)}
                className={`text-xs px-3 py-1.5 rounded-xl border font-medium transition-colors ${
                  dureeFilter === d.label
                    ? "bg-secondary text-white border-secondary"
                    : "bg-surface-container border-outline-variant text-on-surface-variant hover:border-secondary/50 hover:text-on-surface"
                }`}
              >
                {d.label}
              </button>
            ))}
            {(deptFilter || dureeFilter) && (
              <button
                onClick={() => { setDeptFilter(null); setDureeFilter(null); }}
                className="text-xs px-3 py-1.5 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-colors font-medium flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">filter_alt_off</span>
                Effacer filtres
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-10 py-4 lg:py-6">
        {loading && (
          <div className="flex items-center justify-center py-20 text-on-surface-variant">
            <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
            Chargement des offres…
          </div>
        )}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">{error}</div>
        )}
        {!loading && !error && (
          <>
            <p className="text-sm text-on-surface-variant mb-4">
              <span className="font-semibold text-on-surface">{filtered.length}</span> offre
              {filtered.length > 1 ? "s" : ""} trouvée{filtered.length > 1 ? "s" : ""}
              {" "}— triées par pertinence IA
            </p>
            <div className="space-y-4 max-w-3xl">
              {filtered.length === 0 && (
                <div className="text-center py-16 text-on-surface-variant">
                  <span className="material-symbols-outlined text-5xl block mb-3">search_off</span>
                  Aucune offre ne correspond à votre recherche.
                </div>
              )}
              {filtered.map((annonce) => (
                <Link
                  key={annonce.id}
                  to={`/etudiant/offre/${annonce.id}`}
                  className="block bg-surface-container-low rounded-2xl p-4 sm:p-6 border border-outline-variant hover:border-primary/30 hover:shadow-md transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="flex gap-3 sm:gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary flex-shrink-0 text-sm">
                        {(annonce.nom_entreprise ?? "?").slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-on-surface mb-1">{annonce.titre}</h3>
                        <div className="text-sm text-on-surface-variant mb-3">
                          {annonce.nom_entreprise} · {annonce.ville ?? "Maroc"}
                        </div>
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-lg">
                            {annonce.departement}
                          </span>
                          {annonce.duree_mois && (
                            <span className="text-xs bg-surface-container text-on-surface-variant px-2 py-1 rounded-lg">
                              {annonce.duree_mois} mois
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-on-surface-variant line-clamp-2">
                          {annonce.description}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-on-surface-variant sm:ml-4 flex-shrink-0">
                      {new Date(annonce.created_at).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
