import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { ENSMR_DEPARTEMENTS } from "../../constants/ensmr";

export default function PublierOffre() {
  const navigate = useNavigate();
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [dureeMois, setDureeMois] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function toggleDept(dept: string) {
    setSelectedDepts((prev) =>
      prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedDepts.length === 0) {
      setError("Sélectionnez au moins un département.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await api.creerAnnonce({
        titre,
        description,
        departement: selectedDepts[0],
        departements: selectedDepts,
        duree_mois: dureeMois ? parseInt(dureeMois) : null,
      });
      setSuccess(
        `Offre soumise pour ${selectedDepts.length} département(s) ! Un email sera envoyé aux chefs concernés pour validation.`
      );
      setTimeout(() => navigate("/entreprise/mes-offres"), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de la soumission");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col">
      <div className="px-10 pt-8 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-on-surface transition-colors mb-4"
        >
          <span className="material-symbols-outlined text-xl">arrow_back</span>
          Retour
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-headline font-extrabold text-3xl text-on-surface mb-1">
              Publier une offre
            </h1>
            <p className="text-on-surface-variant text-sm">
              Chaque département sélectionné sera notifié indépendamment — son chef valide pour ses étudiants.
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-xl">
            <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
              auto_awesome
            </span>
            <span className="text-sm font-medium text-primary">Matching IA activé</span>
          </div>
        </div>
      </div>

      <div className="flex-1 px-10 pb-10 grid grid-cols-3 gap-6">
        <div className="col-span-2">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>
          )}
          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm flex items-center gap-2">
              <span className="material-symbols-outlined">check_circle</span>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-surface-container-low rounded-2xl border border-outline-variant p-8 space-y-6">
            {/* Titre */}
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-2">
                Titre du poste <span className="text-error">*</span>
              </label>
              <input
                type="text"
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
                placeholder="ex. Stage Développeur Full-Stack"
                required
                className="w-full border border-outline-variant rounded-xl px-4 py-3 text-sm text-on-surface bg-surface placeholder-on-surface-variant outline-none focus:border-primary transition-colors"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-2">
                Description <span className="text-error">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={8}
                required
                placeholder="Missions, environnement de travail, objectifs du stage…"
                className="w-full border border-outline-variant rounded-xl px-4 py-3 text-sm text-on-surface bg-surface placeholder-on-surface-variant outline-none focus:border-primary transition-colors resize-none"
              />
              <div className="text-right text-xs text-on-surface-variant mt-1">
                {description.length}/2000 caractères
              </div>
            </div>

            {/* Départements ciblés */}
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-1">
                Départements ciblés <span className="text-error">*</span>
              </label>
              <p className="text-xs text-on-surface-variant mb-3">
                Chaque chef de département sélectionné validera indépendamment. Les étudiants d'un département ne voient l'offre qu'après validation de leur chef.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {ENSMR_DEPARTEMENTS.map((dept) => {
                  const selected = selectedDepts.includes(dept.nom);
                  return (
                    <button
                      key={dept.nom}
                      type="button"
                      onClick={() => toggleDept(dept.nom)}
                      className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                        selected
                          ? "border-primary bg-primary/10"
                          : "border-outline-variant hover:border-primary/40 hover:bg-surface-container"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        selected ? "bg-primary" : "border-2 border-outline-variant"
                      }`}>
                        {selected && (
                          <span className="material-symbols-outlined text-white text-sm">check</span>
                        )}
                      </div>
                      <div>
                        <div className={`text-xs font-semibold leading-tight ${selected ? "text-primary" : "text-on-surface"}`}>
                          {dept.nom}
                        </div>
                        <div className="text-xs text-on-surface-variant mt-0.5">
                          {dept.filieres.slice(0, 2).join(", ")}
                          {dept.filieres.length > 2 && ` +${dept.filieres.length - 2}`}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              {selectedDepts.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {selectedDepts.map((d) => (
                    <span key={d} className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-lg font-medium flex items-center gap-1">
                      {d}
                      <button type="button" onClick={() => toggleDept(d)} className="hover:text-primary/60">
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Durée */}
            <div className="w-48">
              <label className="block text-sm font-semibold text-on-surface mb-2">Durée (mois)</label>
              <input
                type="number"
                value={dureeMois}
                onChange={(e) => setDureeMois(e.target.value)}
                placeholder="ex. 6"
                min={1}
                max={24}
                className="w-full border border-outline-variant rounded-xl px-4 py-3 text-sm text-on-surface bg-surface outline-none focus:border-primary transition-colors"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={loading || selectedDepts.length === 0}
                className="btn-primary flex-1 justify-center disabled:opacity-60"
              >
                {loading ? (
                  <span className="material-symbols-outlined text-xl animate-spin">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-xl">send</span>
                )}
                Soumettre pour validation
                {selectedDepts.length > 0 && ` (${selectedDepts.length} dept.)`}
              </button>
              <button type="button" onClick={() => navigate(-1)} className="btn-ghost">Annuler</button>
            </div>
          </form>
        </div>

        {/* Sidebar */}
        <div className="col-span-1 space-y-4">
          <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl border border-primary/10 p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
              <h3 className="font-semibold text-primary">Processus de validation</h3>
            </div>
            <div className="space-y-3 text-sm text-on-surface-variant">
              {[
                "Vous soumettez l'offre pour 1 ou plusieurs départements",
                "Un email est envoyé aux chefs de chaque département sélectionné",
                "Chaque chef valide ou refuse indépendamment",
                "Les étudiants d'un département voient l'offre dès que LEUR chef l'a validée",
                "Vous recevez un email pour chaque décision",
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="font-bold text-primary flex-shrink-0">{i + 1}.</span>
                  {step}
                </div>
              ))}
            </div>
          </div>

          {/* Aperçu */}
          <div className="bg-surface-container-low rounded-2xl border border-outline-variant p-5">
            <h3 className="font-semibold text-on-surface mb-3 text-sm">Aperçu</h3>
            <div className="bg-surface rounded-xl p-4 border border-outline-variant">
              <div className="font-semibold text-on-surface text-sm mb-1">{titre || "Titre de l'offre"}</div>
              {selectedDepts.length > 0 ? (
                <div className="flex flex-wrap gap-1 mb-2">
                  {selectedDepts.map((d) => (
                    <span key={d} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-lg">{d}</span>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-on-surface-variant mb-2">Aucun département sélectionné</div>
              )}
              {dureeMois && (
                <div className="text-xs bg-surface-container text-on-surface-variant px-2 py-0.5 rounded-lg inline-block">
                  {dureeMois} mois
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
