import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type Annonce } from '../../api/client';

interface Profil { nom: string; prenom: string; filiere?: string; niveau?: string; competences: string[]; }
interface Candidature { id: string; annonce_id: string; date: string; titre_annonce?: string; nom_entreprise?: string; }

export default function DashboardEtudiant() {
  const [profil, setProfil] = useState<Profil | null>(null);
  const [candidatures, setCandidatures] = useState<Candidature[]>([]);
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getMonProfil() as Promise<Profil>,
      api.getMesCandidatures() as Promise<Candidature[]>,
      api.getAnnonces() as Promise<Annonce[]>,
    ]).then(([p, c, a]) => {
      setProfil(p); setCandidatures(c); setAnnonces(a);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const prenom = profil?.prenom || 'Étudiant';
  const topAnnonces = annonces.slice(0, 4);

  return (
    <main className="min-h-screen pb-12 px-10 pt-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-headline font-extrabold text-3xl text-on-surface mb-1">
            Bienvenue, {loading ? '…' : prenom} !
          </h1>
          <p className="text-on-surface-variant">
            {profil?.filiere ? `${profil.filiere}${profil.niveau ? ` · ${profil.niveau}` : ''}` : 'Complétez votre profil pour activer le matching IA'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-xl">
            <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            <span className="text-sm font-medium text-primary">IA activée</span>
          </div>
          <Link to="/etudiant/recherche" className="btn-primary">
            <span className="material-symbols-outlined text-xl">search</span>
            Rechercher
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-5 mb-8">
        <div className="bg-gradient-to-br from-primary to-secondary rounded-2xl p-6 text-white">
          <span className="material-symbols-outlined text-3xl text-white/80 mb-3 block" style={{ fontVariationSettings: "'FILL' 1" }}>assignment</span>
          <div className="font-headline font-extrabold text-4xl mb-1">{loading ? '—' : candidatures.length}</div>
          <div className="text-white/80 text-sm font-medium">Candidatures envoyées</div>
        </div>
        <div className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant">
          <div className="w-11 h-11 rounded-xl bg-secondary/10 flex items-center justify-center mb-3">
            <span className="material-symbols-outlined text-secondary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>work</span>
          </div>
          <div className="font-headline font-extrabold text-4xl text-on-surface mb-1">{loading ? '—' : annonces.length}</div>
          <div className="text-on-surface-variant text-sm font-medium">Offres disponibles</div>
        </div>
        <div className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant">
          <div className="w-11 h-11 rounded-xl bg-tertiary/10 flex items-center justify-center mb-3">
            <span className="material-symbols-outlined text-tertiary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
          </div>
          <div className="font-headline font-extrabold text-4xl text-on-surface mb-1">{loading ? '—' : (profil?.competences.length ?? 0)}</div>
          <div className="text-on-surface-variant text-sm font-medium">Compétences renseignées</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Offres recommandées */}
        <div className="col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              <h2 className="font-headline font-bold text-xl text-on-surface">
                {annonces.length > 0 && candidatures.length === 0 ? 'Offres recommandées par IA' : 'Offres disponibles'}
              </h2>
            </div>
            <Link to="/etudiant/recherche" className="text-sm text-primary font-medium hover:underline">Voir tout</Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 text-on-surface-variant">
              <span className="material-symbols-outlined animate-spin text-2xl">progress_activity</span>
            </div>
          ) : topAnnonces.length === 0 ? (
            <div className="bg-surface-container-low rounded-2xl border border-outline-variant p-10 text-center">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-3 block">work_off</span>
              <p className="font-semibold text-on-surface mb-1">Aucune offre disponible</p>
              <p className="text-sm text-on-surface-variant">Les offres validées apparaîtront ici, triées par IA selon votre profil.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {topAnnonces.map((a, i) => (
                <Link key={a.id} to={`/etudiant/offre/${a.id}`}
                  className={`rounded-2xl p-5 border hover:shadow-md transition-all ${
                    i === 0 ? 'col-span-2 bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20 hover:border-primary/40'
                             : 'bg-surface-container-low border-outline-variant hover:border-primary/30'
                  }`}
                >
                  {i === 0 && (
                    <div className="flex items-center gap-2 mb-3">
                      <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                      <span className="text-xs font-semibold text-primary">Meilleur match IA</span>
                    </div>
                  )}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary text-sm flex-shrink-0">
                        {(a.nom_entreprise ?? '?').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-on-surface text-sm leading-tight">{a.titre}</div>
                        <div className="text-xs text-on-surface-variant">{a.nom_entreprise ?? 'Entreprise'}</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-lg">{a.departement}</span>
                    {a.duree_mois && <span className="text-xs bg-surface-container text-on-surface-variant px-2 py-1 rounded-lg">{a.duree_mois} mois</span>}
                    {a.ville && <span className="text-xs bg-surface-container text-on-surface-variant px-2 py-1 rounded-lg">{a.ville}</span>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Mes candidatures récentes */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-headline font-bold text-lg text-on-surface">Mes candidatures</h2>
              <Link to="/etudiant/candidatures" className="text-sm text-primary font-medium hover:underline">Voir tout</Link>
            </div>
            <div className="bg-surface-container-low rounded-2xl border border-outline-variant p-4 space-y-3">
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <span className="material-symbols-outlined animate-spin text-on-surface-variant">progress_activity</span>
                </div>
              ) : candidatures.length === 0 ? (
                <div className="text-center py-6">
                  <span className="material-symbols-outlined text-3xl text-on-surface-variant mb-2 block">assignment</span>
                  <p className="text-xs text-on-surface-variant">Aucune candidature</p>
                  <Link to="/etudiant/recherche" className="mt-2 text-xs font-semibold text-primary hover:underline block">
                    Explorer les offres
                  </Link>
                </div>
              ) : (
                candidatures.slice(0, 4).map((c) => (
                  <Link key={c.id} to={`/etudiant/offre/${c.annonce_id}`}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-container transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                      {(c.nom_entreprise ?? '?').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-on-surface truncate">{c.titre_annonce ?? 'Offre'}</div>
                      <div className="text-xs text-on-surface-variant">{c.nom_entreprise}</div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Mon profil / CV */}
          <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl border border-primary/10 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>tips_and_updates</span>
              <span className="text-sm font-semibold text-primary">Votre profil</span>
            </div>
            {profil?.competences?.length ? (
              <>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {profil.competences.slice(0, 4).map((c) => (
                    <span key={c} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-lg">{c}</span>
                  ))}
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed mb-2">
                  Uploadez votre CV PDF pour activer le matching IA et être classé en tête chez les recruteurs.
                </p>
              </>
            ) : (
              <p className="text-xs text-on-surface-variant leading-relaxed mb-2">
                Complétez votre profil et uploadez votre CV pour que l'IA vous recommande les meilleures offres.
              </p>
            )}
            <Link to="/etudiant/profil/me" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
              Gérer mon profil
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
