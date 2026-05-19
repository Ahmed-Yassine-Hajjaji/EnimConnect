import { useEffect, useState } from "react";
import { api, type EtudiantRecherche } from "../../api/client";
import { NOMS_DEPARTEMENTS } from "../../constants/ensmr";

const DEPARTEMENTS = ["Tous", ...NOMS_DEPARTEMENTS];

const NIVEAUX = ["Tous", "1A", "2A", "3A"];

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

export default function CandidatsFavoris() {
  const [etudiants, setEtudiants] = useState<EtudiantRecherche[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [departement, setDepartement] = useState("Tous");
  const [niveau, setNiveau] = useState("Tous");
  const [favoris, setFavoris] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem("favoris_etudiants") ?? "[]")); }
    catch { return new Set(); }
  });

  function toggleFavori(id: string) {
    setFavoris((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem("favoris_etudiants", JSON.stringify([...next]));
      return next;
    });
  }

  function load() {
    setLoading(true);
    api.rechercherEtudiants({
      departement: departement !== "Tous" ? departement : undefined,
      niveau: niveau !== "Tous" ? niveau : undefined,
    })
      .then(setEtudiants)
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [departement, niveau]);

  const filtered = etudiants.filter((e) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      e.nom.toLowerCase().includes(q) ||
      e.prenom.toLowerCase().includes(q) ||
      (e.filiere ?? "").toLowerCase().includes(q) ||
      e.competences.some((c) => c.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex-grow flex flex-col min-h-screen">
      {/* Header */}
      <div className="sticky top-16 z-10 bg-surface/95 backdrop-blur-md border-b border-outline-variant px-4 sm:px-6 lg:px-10 py-4 lg:py-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="font-headline font-bold text-2xl text-on-surface">Recherche d'étudiants</h1>
            <p className="text-sm text-on-surface-variant mt-0.5">
              {loading ? "Chargement…" : `${filtered.length} étudiant${filtered.length !== 1 ? "s" : ""} trouvé${filtered.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-xl self-start sm:self-auto">
            <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>person_search</span>
            <span className="text-sm font-medium text-primary">Base étudiants ENSMR</span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-surface-container border border-outline-variant rounded-xl px-3 py-2 flex-1 sm:flex-none sm:w-56">
            <span className="material-symbols-outlined text-on-surface-variant text-lg">search</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nom, filière, compétence…"
              className="bg-transparent text-sm text-on-surface placeholder-on-surface-variant outline-none w-full"
            />
          </div>

          <select
            value={departement}
            onChange={(e) => setDepartement(e.target.value)}
            className="border border-outline-variant rounded-xl px-3 py-2 text-sm text-on-surface bg-surface outline-none focus:border-primary"
          >
            {DEPARTEMENTS.map((d) => <option key={d}>{d}</option>)}
          </select>

          <select
            value={niveau}
            onChange={(e) => setNiveau(e.target.value)}
            className="border border-outline-variant rounded-xl px-3 py-2 text-sm text-on-surface bg-surface outline-none focus:border-primary min-w-[80px]"
          >
            {NIVEAUX.map((n) => <option key={n}>{n}</option>)}
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 lg:px-10 py-6 flex-1">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <span className="material-symbols-outlined text-4xl animate-spin text-on-surface-variant">progress_activity</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-4">person_search</span>
            <p className="font-semibold text-on-surface mb-2 text-lg">Aucun étudiant trouvé</p>
            <p className="text-on-surface-variant text-sm">Modifiez vos filtres ou attendez que des étudiants complètent leur profil.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((e, i) => (
              <div
                key={e.etudiant_id}
                className="bg-surface-container-low rounded-2xl border border-outline-variant p-5 hover:border-primary/30 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${COLORS[i % COLORS.length]} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                      {initiales(e.nom, e.prenom)}
                    </div>
                    <div>
                      <div className="font-semibold text-on-surface text-sm leading-tight">{e.prenom} {e.nom}</div>
                      <div className="text-xs text-on-surface-variant leading-tight mt-0.5">
                        {e.filiere ?? e.departement ?? "ENSMR"}
                        {e.niveau ? ` · ${e.niveau}` : ""}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {e.a_un_cv && (
                      <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-lg font-medium">CV IA</span>
                    )}
                    <button
                      onClick={() => toggleFavori(e.etudiant_id)}
                      title={favoris.has(e.etudiant_id) ? "Retirer des favoris" : "Ajouter aux favoris"}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                        favoris.has(e.etudiant_id)
                          ? "bg-red-50 text-red-500 hover:bg-red-100"
                          : "bg-surface-container text-on-surface-variant hover:bg-red-50 hover:text-red-400"
                      }`}
                    >
                      <span
                        className="material-symbols-outlined text-lg"
                        style={{ fontVariationSettings: favoris.has(e.etudiant_id) ? "'FILL' 1" : "'FILL' 0" }}
                      >
                        favorite
                      </span>
                    </button>
                  </div>
                </div>

                {e.competences.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {e.competences.slice(0, 5).map((s) => (
                      <span key={s} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-lg font-medium">{s}</span>
                    ))}
                  </div>
                )}

                {(e.departement || e.niveau) && (
                  <div className="flex items-center gap-3 text-xs text-on-surface-variant mb-4">
                    {e.departement && (
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">school</span>
                        {e.departement}
                      </span>
                    )}
                  </div>
                )}

                <a
                  href={`mailto:${e.email}`}
                  className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-white bg-gradient-to-r from-primary to-secondary rounded-xl hover:opacity-90 transition-opacity"
                >
                  <span className="material-symbols-outlined text-sm">mail</span>
                  Contacter
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
