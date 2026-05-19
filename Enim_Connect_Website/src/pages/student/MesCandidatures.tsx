import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";

interface Candidature {
  id: string;
  annonce_id: string;
  date: string;
  titre_annonce: string | null;
  nom_entreprise: string | null;
}

export default function MesCandidatures() {
  const [candidatures, setCandidatures] = useState<Candidature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getMesCandidatures()
      .then((data) => setCandidatures(data as Candidature[]))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleRetirer(annonceId: string) {
    await api.retirerCandidature(annonceId);
    setCandidatures((prev) => prev.filter((c) => c.annonce_id !== annonceId));
  }

  return (
    <main className="min-h-screen">
      <div className="sticky top-16 z-10 bg-surface/90 backdrop-blur-md border-b border-outline-variant px-4 sm:px-6 lg:px-10 py-4 lg:py-5">
        <div className="mb-2">
          <h1 className="font-headline font-bold text-2xl text-on-surface">Mes candidatures</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            Suivez l'état de toutes vos candidatures
          </p>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-10 py-4 lg:py-6 max-w-3xl">
        {loading && (
          <div className="flex items-center text-on-surface-variant py-10">
            <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
            Chargement…
          </div>
        )}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">{error}</div>
        )}
        {!loading && !error && candidatures.length === 0 && (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant block mb-3">
              assignment
            </span>
            <p className="text-on-surface-variant">Vous n'avez encore postulé à aucune offre.</p>
            <Link
              to="/etudiant/recherche"
              className="mt-4 inline-flex items-center gap-2 text-primary font-semibold hover:underline"
            >
              Explorer les offres
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
        )}
        <div className="space-y-4">
          {candidatures.map((c) => (
            <div
              key={c.id}
              className="bg-surface-container-low rounded-2xl p-4 sm:p-6 border border-outline-variant hover:shadow-sm transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex gap-3 sm:gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary flex-shrink-0 text-sm">
                    {(c.nom_entreprise ?? "?").slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-on-surface mb-1">
                      {c.titre_annonce ?? "Offre"}
                    </h3>
                    <div className="text-sm text-on-surface-variant mb-2">
                      {c.nom_entreprise}
                    </div>
                    <div className="text-xs text-on-surface-variant">
                      Candidature envoyée le{" "}
                      {new Date(c.date).toLocaleDateString("fr-FR")}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0 sm:ml-4 self-start sm:self-auto">
                  <Link
                    to={`/etudiant/offre/${c.annonce_id}`}
                    className="btn-ghost text-xs px-3 py-2"
                  >
                    Voir l'offre
                  </Link>
                  <button
                    onClick={() => handleRetirer(c.annonce_id)}
                    className="text-xs px-3 py-2 text-error border border-error/30 rounded-xl hover:bg-error/10 transition-colors"
                  >
                    Retirer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
