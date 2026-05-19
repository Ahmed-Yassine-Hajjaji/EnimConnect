import { useState, useEffect } from "react";
import { api } from "../../api/client";

interface Entreprise {
  id: string;
  nom_entreprise: string;
  secteur: string | null;
  ville: string | null;
  valide: boolean;
  email: string;
}

function ResetPasswordModal({ entreprise, onClose }: { entreprise: Entreprise; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleReset() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.resetEntreprisePassword(entreprise.id);
      setNewPassword(res.nouveau_mot_de_passe);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur lors de la réinitialisation");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-surface rounded-3xl border border-outline-variant shadow-xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="font-headline font-bold text-on-surface text-lg">Réinitialiser le mot de passe</h2>
            <p className="text-sm text-on-surface-variant mt-0.5">{entreprise.nom_entreprise}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>

        {!newPassword ? (
          <>
            <p className="text-sm text-on-surface-variant mb-5">
              Un nouveau mot de passe sécurisé sera généré et attribué au compte <strong>{entreprise.email}</strong>. Le mot de passe actuel sera immédiatement invalidé.
            </p>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">{error}</div>
            )}
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 btn-ghost">Annuler</button>
              <button
                onClick={handleReset}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-error text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {loading && <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>}
                Réinitialiser
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="mb-5 p-4 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-sm text-green-700 font-medium mb-2">Nouveau mot de passe généré :</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm font-mono bg-white border border-green-300 rounded-lg px-3 py-2 text-on-surface select-all">
                  {newPassword}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(newPassword)}
                  className="p-2 rounded-lg hover:bg-green-100 transition-colors"
                  title="Copier"
                >
                  <span className="material-symbols-outlined text-green-600 text-base">content_copy</span>
                </button>
              </div>
            </div>
            <p className="text-xs text-on-surface-variant mb-5">
              Copiez ce mot de passe et transmettez-le à l'entreprise. Il ne sera plus affiché après fermeture.
            </p>
            <button onClick={onClose} className="w-full btn-primary justify-center">Fermer</button>
          </>
        )}
      </div>
    </div>
  );
}

function DeleteEntrepriseModal({ entreprise, onClose, onDeleted }: { entreprise: Entreprise; onClose: () => void; onDeleted: (id: string) => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setLoading(true); setError(null);
    try {
      await api.supprimerEntreprise(entreprise.id);
      onDeleted(entreprise.id);
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur lors de la suppression");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-surface rounded-3xl border border-outline-variant shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-error/10 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-error text-xl">delete_forever</span>
            </div>
            <div>
              <h2 className="font-headline font-bold text-on-surface text-lg">Supprimer définitivement</h2>
              <p className="text-sm text-on-surface-variant mt-0.5">{entreprise.nom_entreprise}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>
        <div className="p-4 bg-error/5 border border-error/20 rounded-xl mb-5">
          <p className="text-sm text-on-surface">
            Cette action est <strong>irréversible</strong>. Le compte, toutes les offres publiées, les candidatures reçues et les données associées seront supprimés définitivement.
          </p>
        </div>
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">{error}</div>}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 btn-ghost">Annuler</button>
          <button onClick={handleDelete} disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-error text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-60">
            {loading && <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>}
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EntreprisesValidation() {
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"toutes" | "en_attente" | "validees">("toutes");
  const [resetTarget, setResetTarget] = useState<Entreprise | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Entreprise | null>(null);

  useEffect(() => {
    api
      .getEntreprises()
      .then((data) => setEntreprises(data as Entreprise[]))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleValider(id: string) {
    await api.validerEntreprise(id);
    setEntreprises((prev) =>
      prev.map((e) => (e.id === id ? { ...e, valide: true } : e))
    );
  }

  async function handleRejeter(id: string) {
    await api.rejeterEntreprise(id);
    setEntreprises((prev) =>
      prev.map((e) => (e.id === id ? { ...e, valide: false } : e))
    );
  }

  const filtered = entreprises.filter((e) => {
    if (filter === "en_attente") return !e.valide;
    if (filter === "validees") return e.valide;
    return true;
  });

  return (
    <main className="min-h-screen flex flex-col">
      {resetTarget && (
        <ResetPasswordModal entreprise={resetTarget} onClose={() => setResetTarget(null)} />
      )}
      {deleteTarget && (
        <DeleteEntrepriseModal
          entreprise={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={(id) => setEntreprises((prev) => prev.filter((e) => e.id !== id))}
        />
      )}

      <div className="sticky top-16 z-10 bg-surface/90 backdrop-blur-md border-b border-outline-variant px-4 sm:px-6 lg:px-10 py-4 lg:py-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-headline font-bold text-2xl text-on-surface">
              Validation des entreprises
            </h1>
            <p className="text-sm text-on-surface-variant mt-0.5">
              Validez les comptes entreprises avant qu'ils puissent publier des offres
            </p>
          </div>
        </div>
        <div className="flex bg-surface-container rounded-xl p-1 w-full sm:w-fit gap-1 overflow-x-auto">
          {(["toutes", "en_attente", "validees"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? "bg-white shadow-sm text-on-surface"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {f === "toutes" ? "Toutes" : f === "en_attente" ? "En attente" : "Validées"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 px-4 sm:px-6 lg:px-10 py-6">
        {loading && (
          <div className="flex items-center text-on-surface-variant py-10">
            <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
            Chargement…
          </div>
        )}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">{error}</div>
        )}

        {!loading && !error && (
          <div className="bg-surface-container-low rounded-2xl border border-outline-variant overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Entreprise
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Secteur
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Ville
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Email
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-on-surface-variant text-sm">
                      Aucune entreprise trouvée.
                    </td>
                  </tr>
                )}
                {filtered.map((e) => (
                  <tr key={e.id} className="hover:bg-surface-container/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-on-surface text-sm">
                      {e.nom_entreprise}
                    </td>
                    <td className="px-4 py-4 text-sm text-on-surface-variant">{e.secteur ?? "—"}</td>
                    <td className="px-4 py-4 text-sm text-on-surface-variant">{e.ville ?? "—"}</td>
                    <td className="px-4 py-4 text-sm text-on-surface-variant">{e.email}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                          e.valide
                            ? "bg-green-50 text-green-600"
                            : "bg-orange-50 text-orange-600"
                        }`}
                      >
                        {e.valide ? "Validée" : "En attente"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {!e.valide && (
                          <button
                            onClick={() => handleValider(e.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-600 text-xs font-semibold rounded-xl hover:bg-green-100 transition-colors"
                          >
                            <span
                              className="material-symbols-outlined text-sm"
                              style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                              check_circle
                            </span>
                            Valider
                          </button>
                        )}
                        {e.valide && (
                          <button
                            onClick={() => handleRejeter(e.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 text-xs font-semibold rounded-xl hover:bg-red-100 transition-colors"
                          >
                            <span
                              className="material-symbols-outlined text-sm"
                              style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                              cancel
                            </span>
                            Suspendre
                          </button>
                        )}
                        <button
                          onClick={() => setResetTarget(e)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-surface-container text-on-surface-variant text-xs font-semibold rounded-xl hover:bg-surface-container-high hover:text-on-surface transition-colors"
                          title="Réinitialiser le mot de passe"
                        >
                          <span className="material-symbols-outlined text-sm">lock_reset</span>
                          MDP
                        </button>
                        <button
                          onClick={() => setDeleteTarget(e)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-error/10 text-error text-xs font-semibold rounded-xl hover:bg-error/20 transition-colors"
                          title="Supprimer définitivement"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
