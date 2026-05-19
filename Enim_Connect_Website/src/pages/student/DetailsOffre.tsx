import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/client";

interface AnnonceDetail {
  id: string;
  titre: string;
  description: string;
  departement: string;
  duree_mois: number | null;
  nom_entreprise: string | null;
  ville: string | null;
  created_at: string;
}

export default function DetailsOffre() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [annonce, setAnnonce] = useState<AnnonceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [dejaPostule, setDejaPostule] = useState(false);
  const [aUnCv, setAUnCv] = useState<boolean | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.getAnnonce(id) as Promise<AnnonceDetail>,
      api.getMesCandidatures() as Promise<{ annonce_id: string }[]>,
      api.getMonCV().catch(() => null),
    ])
      .then(([annonceData, candidatures, cv]) => {
        setAnnonce(annonceData);
        setAUnCv(cv !== null);
        if (candidatures.some((c) => c.annonce_id === id)) {
          setDejaPostule(true);
          setApplied(true);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handlePostuler() {
    if (!id) return;
    setApplying(true);
    setApplyError(null);
    try {
      await api.postuler(id);
      setApplied(true);
    } catch (e: unknown) {
      setApplyError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setApplying(false);
    }
  }

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
        Chargement…
      </div>
    );

  if (error || !annonce)
    return (
      <div className="p-10">
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
          {error ?? "Annonce introuvable"}
        </div>
      </div>
    );

  return (
    <main className="min-h-screen">
      <div className="px-10 pt-6 pb-2">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined text-xl">arrow_back</span>
          Retour aux résultats
        </button>
      </div>

      <div className="px-10 py-4 grid grid-cols-12 gap-6">
        <div className="col-span-8 space-y-6">
          <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl border border-primary/20 p-8">
            <div className="flex items-start gap-5">
              <div className="w-16 h-16 rounded-2xl bg-white border border-outline-variant flex items-center justify-center font-bold text-primary text-lg shadow-sm">
                {(annonce.nom_entreprise ?? "?").slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1">
                <h1 className="font-headline font-bold text-2xl text-on-surface mb-2">
                  {annonce.titre}
                </h1>
                <div className="flex items-center gap-4 text-sm text-on-surface-variant flex-wrap">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-base">business</span>
                    {annonce.nom_entreprise}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-base">location_on</span>
                    {annonce.ville ?? "Maroc"}
                  </span>
                  {annonce.duree_mois && (
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-base">schedule</span>
                      {annonce.duree_mois} mois
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  <span className="px-3 py-1.5 bg-primary/10 text-primary text-xs font-medium rounded-xl">
                    {annonce.departement}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-low rounded-2xl border border-outline-variant p-6">
            <h2 className="font-headline font-bold text-lg text-on-surface mb-4">
              Description du stage
            </h2>
            <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap">
              {annonce.description}
            </p>
          </div>
        </div>

        <div className="col-span-4">
          <div className="sticky top-24 space-y-4">
            <div className="bg-surface-container-low rounded-2xl border border-outline-variant p-5">
              <div className="mb-4 text-sm text-on-surface-variant">
                Publiée le{" "}
                <span className="font-semibold text-on-surface">
                  {new Date(annonce.created_at).toLocaleDateString("fr-FR")}
                </span>
              </div>

              {applyError && (
                <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                  {applyError}
                </div>
              )}

              {applied ? (
                <div className={`w-full p-3 border text-sm font-semibold rounded-xl text-center flex items-center justify-center gap-2 ${
                  dejaPostule
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-green-50 border-green-200 text-green-700'
                }`}>
                  <span className="material-symbols-outlined text-base">check_circle</span>
                  {dejaPostule ? 'Vous avez déjà postulé à cette offre' : 'Candidature envoyée !'}
                </div>
              ) : aUnCv === false ? (
                <div className="w-full p-4 bg-orange-50 border border-orange-200 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-orange-500 text-lg">warning</span>
                    <span className="text-sm font-semibold text-orange-700">CV requis</span>
                  </div>
                  <p className="text-xs text-orange-600 mb-3">
                    Vous devez uploader votre CV avant de pouvoir postuler à une offre.
                  </p>
                  <a
                    href="/etudiant/profil/me"
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 text-white text-xs font-semibold rounded-xl hover:opacity-90 transition-opacity"
                  >
                    <span className="material-symbols-outlined text-sm">upload_file</span>
                    Compléter mon profil
                  </a>
                </div>
              ) : (
                <button
                  onClick={handlePostuler}
                  disabled={applying}
                  className="w-full bg-gradient-to-r from-primary to-secondary text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {applying ? (
                    <span className="material-symbols-outlined text-xl">progress_activity</span>
                  ) : (
                    <span className="material-symbols-outlined text-xl">send</span>
                  )}
                  Postuler maintenant
                </button>
              )}
            </div>

            <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl border border-primary/10 p-5">
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="material-symbols-outlined text-primary text-xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  auto_awesome
                </span>
                <span className="font-semibold text-primary text-sm">Recommandé par l'IA</span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Cette offre a été classée par notre moteur IA en fonction de votre profil et de votre CV.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
