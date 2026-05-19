import React, { useEffect, useState } from "react";
import { api } from "../../api/client";
import { NOMS_DEPARTEMENTS, DEPT_TO_FILIERES } from "../../constants/ensmr";

interface EtudiantAdmin {
  etudiant_id: string;
  nom: string;
  prenom: string;
  email: string;
  filiere?: string;
  departement?: string;
  niveau?: string;
  competences: string[];
  a_un_cv: boolean;
}

const COLORS = [
  "from-primary to-secondary",
  "from-secondary to-purple-500",
  "from-tertiary to-teal-500",
  "from-orange-500 to-amber-400",
  "from-green-500 to-emerald-400",
];

const DEPARTEMENTS_FILTER = ["Tous", ...NOMS_DEPARTEMENTS];
const NIVEAUX_FILTER = ["Tous", "1A", "2A", "3A"];
const NIVEAUX = ["1A", "2A", "3A"];

function initiales(nom: string, prenom: string) {
  return `${prenom?.[0] ?? ""}${nom?.[0] ?? ""}`.toUpperCase();
}

// ─── Reset Password Modal ─────────────────────────────────────────────────────
function ResetPasswordModal({ etudiant, onClose }: { etudiant: EtudiantAdmin; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleReset() {
    setLoading(true); setError(null);
    try {
      const res = await api.resetEtudiantPassword(etudiant.etudiant_id);
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
      <div className="relative bg-surface rounded-3xl border border-outline-variant shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="font-headline font-bold text-on-surface text-lg">Réinitialiser le mot de passe</h2>
            <p className="text-sm text-on-surface-variant mt-0.5">{etudiant.prenom} {etudiant.nom} · {etudiant.email}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>

        {!newPassword ? (
          <>
            <p className="text-sm text-on-surface-variant mb-5">
              Un nouveau mot de passe sécurisé sera généré. Le mot de passe actuel sera immédiatement invalidé.
            </p>
            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">{error}</div>}
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 btn-ghost">Annuler</button>
              <button onClick={handleReset} disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-error text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-60">
                {loading && <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>}
                Réinitialiser
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="mb-5 p-4 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-sm text-green-700 font-medium mb-2">Nouveau mot de passe :</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm font-mono bg-white border border-green-300 rounded-lg px-3 py-2 text-on-surface select-all">{newPassword}</code>
                <button onClick={() => navigator.clipboard.writeText(newPassword)} className="p-2 rounded-lg hover:bg-green-100" title="Copier">
                  <span className="material-symbols-outlined text-green-600 text-base">content_copy</span>
                </button>
              </div>
            </div>
            <p className="text-xs text-on-surface-variant mb-5">Transmettez ce mot de passe à l'étudiant. Il ne sera plus affiché après fermeture.</p>
            <button onClick={onClose} className="w-full btn-primary justify-center">Fermer</button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
function DeleteEtudiantModal({ etudiant, onClose, onDeleted }: { etudiant: EtudiantAdmin; onClose: () => void; onDeleted: (id: string) => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setLoading(true); setError(null);
    try {
      await api.supprimerEtudiant(etudiant.etudiant_id);
      onDeleted(etudiant.etudiant_id);
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
              <p className="text-sm text-on-surface-variant mt-0.5">{etudiant.prenom} {etudiant.nom}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>
        <div className="p-4 bg-error/5 border border-error/20 rounded-xl mb-5">
          <p className="text-sm text-on-surface">
            Cette action est <strong>irréversible</strong>. Le compte, le CV, les candidatures et toutes les données associées seront supprimés définitivement.
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

// ─── Create Student Modal ─────────────────────────────────────────────────────
function CreerEtudiantModal({ onClose, onCreated }: { onClose: () => void; onCreated: (e: EtudiantAdmin) => void }) {
  const [form, setForm] = useState({ email: "", password: "", nom: "", prenom: "", departement: "", filiere: "", niveau: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value, ...(field === "departement" ? { filiere: "" } : {}) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.email || !form.password || !form.nom || !form.prenom) {
      setError("Email, mot de passe, nom et prénom sont obligatoires.");
      return;
    }
    setLoading(true); setError(null);
    try {
      await api.creerCompteEtudiant({
        email: form.email,
        password: form.password,
        nom: form.nom,
        prenom: form.prenom,
        filiere: form.filiere || undefined,
        departement: form.departement || undefined,
        niveau: form.niveau || undefined,
      });
      onCreated({
        etudiant_id: crypto.randomUUID(),
        nom: form.nom,
        prenom: form.prenom,
        email: form.email,
        filiere: form.filiere || undefined,
        departement: form.departement || undefined,
        niveau: form.niveau || undefined,
        competences: [],
        a_un_cv: false,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  }

  const filieres = DEPT_TO_FILIERES[form.departement] ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-surface rounded-3xl border border-outline-variant shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 pt-6 pb-4 border-b border-outline-variant flex items-center justify-between">
          <h2 className="font-headline font-bold text-on-surface text-lg">Créer un compte étudiant</h2>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">{error}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-1.5">Prénom <span className="text-error">*</span></label>
              <input value={form.prenom} onChange={(e) => set("prenom", e.target.value)} required
                className="w-full border border-outline-variant rounded-xl px-4 py-2.5 text-sm bg-surface outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-1.5">Nom <span className="text-error">*</span></label>
              <input value={form.nom} onChange={(e) => set("nom", e.target.value)} required
                className="w-full border border-outline-variant rounded-xl px-4 py-2.5 text-sm bg-surface outline-none focus:border-primary" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-on-surface mb-1.5">Email <span className="text-error">*</span></label>
            <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required
              placeholder="etudiant@enim.ac.ma"
              className="w-full border border-outline-variant rounded-xl px-4 py-2.5 text-sm bg-surface outline-none focus:border-primary" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-on-surface mb-1.5">Mot de passe temporaire <span className="text-error">*</span></label>
            <input type="text" value={form.password} onChange={(e) => set("password", e.target.value)} required
              placeholder="Min. 8 caractères"
              className="w-full border border-outline-variant rounded-xl px-4 py-2.5 text-sm bg-surface outline-none focus:border-primary" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-1.5">Département</label>
              <select value={form.departement} onChange={(e) => set("departement", e.target.value)}
                className="w-full border border-outline-variant rounded-xl px-4 py-2.5 text-sm bg-surface outline-none focus:border-primary">
                <option value="">— Choisir —</option>
                {NOMS_DEPARTEMENTS.map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-1.5">Niveau</label>
              <select value={form.niveau} onChange={(e) => set("niveau", e.target.value)}
                className="w-full border border-outline-variant rounded-xl px-4 py-2.5 text-sm bg-surface outline-none focus:border-primary">
                <option value="">— Choisir —</option>
                {NIVEAUX.map((n) => <option key={n}>{n}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-on-surface mb-1.5">Filière</label>
            <select value={form.filiere} onChange={(e) => set("filiere", e.target.value)} disabled={!form.departement}
              className="w-full border border-outline-variant rounded-xl px-4 py-2.5 text-sm bg-surface outline-none focus:border-primary disabled:opacity-50">
              <option value="">— {form.departement ? "Choisir" : "Département d'abord"} —</option>
              {filieres.map((f) => <option key={f}>{f}</option>)}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-ghost">Annuler</button>
            <button type="submit" disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 btn-primary disabled:opacity-60">
              {loading && <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>}
              Créer le compte
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DatabaseEtudiants() {
  const [etudiants, setEtudiants] = useState<EtudiantAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [departement, setDepartement] = useState("Tous");
  const [niveau, setNiveau] = useState("Tous");
  const [cvFilter, setCvFilter] = useState<"tous" | "avec" | "sans">("tous");
  const [resetTarget, setResetTarget] = useState<EtudiantAdmin | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EtudiantAdmin | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    api.getEtudiants()
      .then((data) => setEtudiants(data as EtudiantAdmin[]))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = etudiants.filter((e) => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      e.nom.toLowerCase().includes(q) ||
      e.prenom.toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q) ||
      (e.filiere ?? "").toLowerCase().includes(q) ||
      e.competences.some((c) => c.toLowerCase().includes(q));
    const matchDept = departement === "Tous" || e.departement === departement || e.filiere === departement;
    const matchNiveau = niveau === "Tous" || e.niveau === niveau;
    const matchCv = cvFilter === "tous" || (cvFilter === "avec" ? e.a_un_cv : !e.a_un_cv);
    return matchSearch && matchDept && matchNiveau && matchCv;
  });

  const stats = {
    total: etudiants.length,
    avec_cv: etudiants.filter((e) => e.a_un_cv).length,
  };

  return (
    <main className="min-h-screen flex flex-col">
      {resetTarget && <ResetPasswordModal etudiant={resetTarget} onClose={() => setResetTarget(null)} />}
      {deleteTarget && (
        <DeleteEtudiantModal
          etudiant={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={(id) => setEtudiants((prev) => prev.filter((e) => e.etudiant_id !== id))}
        />
      )}
      {showCreate && (
        <CreerEtudiantModal
          onClose={() => setShowCreate(false)}
          onCreated={(e) => setEtudiants((prev) => [e, ...prev])}
        />
      )}

      {/* Header */}
      <div className="sticky top-16 z-10 bg-surface/95 backdrop-blur-md border-b border-outline-variant px-10 py-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-headline font-bold text-2xl text-on-surface">Base de données étudiants</h1>
            <p className="text-sm text-on-surface-variant mt-0.5">
              {loading ? "Chargement…" : `${filtered.length} étudiant${filtered.length !== 1 ? "s" : ""} · ${stats.avec_cv} avec CV`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-center px-4 py-2 bg-surface-container-low rounded-xl border border-outline-variant">
              <div className="font-headline font-bold text-xl text-on-surface">{stats.total}</div>
              <div className="text-xs text-on-surface-variant">Total inscrits</div>
            </div>
            <div className="text-center px-4 py-2 bg-green-50 rounded-xl border border-green-200">
              <div className="font-headline font-bold text-xl text-green-600">{stats.avec_cv}</div>
              <div className="text-xs text-green-600">Avec CV</div>
            </div>
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              <span className="material-symbols-outlined text-xl">person_add</span>
              Créer un étudiant
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-surface-container border border-outline-variant rounded-xl px-3 py-2 w-60">
            <span className="material-symbols-outlined text-on-surface-variant text-lg">search</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nom, email, compétence…"
              className="bg-transparent text-sm text-on-surface placeholder-on-surface-variant outline-none w-full"
            />
          </div>

          <select value={departement} onChange={(e) => setDepartement(e.target.value)}
            className="border border-outline-variant rounded-xl px-3 py-2 text-sm text-on-surface bg-surface outline-none focus:border-primary">
            {DEPARTEMENTS_FILTER.map((d) => <option key={d}>{d}</option>)}
          </select>

          <select value={niveau} onChange={(e) => setNiveau(e.target.value)}
            className="border border-outline-variant rounded-xl px-3 py-2 text-sm text-on-surface bg-surface outline-none focus:border-primary">
            {NIVEAUX_FILTER.map((n) => <option key={n}>{n}</option>)}
          </select>

          <div className="flex bg-surface-container rounded-xl p-1 gap-1">
            {(["tous", "avec", "sans"] as const).map((f) => (
              <button key={f} onClick={() => setCvFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  cvFilter === f ? "bg-white shadow-sm text-on-surface" : "text-on-surface-variant hover:text-on-surface"
                }`}>
                {f === "tous" ? "Tous" : f === "avec" ? "Avec CV" : "Sans CV"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="px-10 py-6 flex-1">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <span className="material-symbols-outlined text-4xl animate-spin text-on-surface-variant">progress_activity</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-4">people</span>
            <p className="font-semibold text-on-surface mb-2">Aucun étudiant trouvé</p>
            <p className="text-on-surface-variant text-sm">Modifiez vos critères de recherche.</p>
          </div>
        ) : (
          <div className="bg-surface-container-low rounded-2xl border border-outline-variant overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container">
                  {["Étudiant", "Email", "Filière / Département", "Niveau", "Compétences", "CV", "Actions"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {filtered.map((e, i) => (
                  <tr key={e.etudiant_id} className="hover:bg-surface-container/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${COLORS[i % COLORS.length]} flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}>
                          {initiales(e.nom, e.prenom)}
                        </div>
                        <div className="font-medium text-on-surface text-sm">{e.prenom} {e.nom}</div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-on-surface-variant">{e.email}</td>
                    <td className="px-5 py-4 text-sm text-on-surface-variant">{e.filiere ?? e.departement ?? "—"}</td>
                    <td className="px-5 py-4">
                      {e.niveau ? (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-primary/10 text-primary">{e.niveau}</span>
                      ) : <span className="text-sm text-on-surface-variant">—</span>}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1">
                        {e.competences.slice(0, 3).map((c) => (
                          <span key={c} className="text-xs bg-surface-container text-on-surface-variant px-2 py-0.5 rounded-lg">{c}</span>
                        ))}
                        {e.competences.length > 3 && (
                          <span className="text-xs text-on-surface-variant">+{e.competences.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {e.a_un_cv ? (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-green-50 text-green-600 flex items-center gap-1 w-fit">
                          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
                          CV IA
                        </span>
                      ) : (
                        <span className="text-xs text-on-surface-variant">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
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
        )}
      </div>
    </main>
  );
}
