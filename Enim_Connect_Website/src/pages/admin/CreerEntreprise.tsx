import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client";

const SECTEURS = [
  "Informatique & Numérique",
  "Énergie & Électricité",
  "BTP & Génie Civil",
  "Industrie & Manufacture",
  "Mines & Ressources",
  "Conseil & Services",
  "Autre",
];

export default function CreerEntreprise() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nomEntreprise, setNomEntreprise] = useState("");
  const [secteur, setSecteur] = useState("");
  const [ville, setVille] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.creerCompteEntreprise({ email: email.trim(), password: password.trim(), nom_entreprise: nomEntreprise, secteur: secteur || undefined, ville: ville || undefined });
      setSuccess(`Compte entreprise « ${nomEntreprise} » créé et validé avec succès.`);
      setEmail(""); setPassword(""); setNomEntreprise(""); setSecteur(""); setVille("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col">
      <div className="px-4 sm:px-6 lg:px-10 pt-6 lg:pt-8 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-on-surface transition-colors mb-4"
        >
          <span className="material-symbols-outlined text-xl">arrow_back</span>
          Retour
        </button>
        <h1 className="font-headline font-extrabold text-2xl lg:text-3xl text-on-surface mb-1">
          Créer un compte entreprise
        </h1>
        <p className="text-on-surface-variant text-sm">
          Le compte sera créé et validé automatiquement — l'entreprise peut publier des offres immédiatement.
        </p>
      </div>

      <div className="px-4 sm:px-6 lg:px-10 pb-10 flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>
          )}
          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-green-600">check_circle</span>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-surface-container-low rounded-2xl border border-outline-variant p-4 sm:p-8 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-2">
                Nom de l'entreprise <span className="text-error">*</span>
              </label>
              <input
                type="text"
                value={nomEntreprise}
                onChange={(e) => setNomEntreprise(e.target.value)}
                placeholder="ex. Maroc Telecom"
                required
                className="w-full border border-outline-variant rounded-xl px-4 py-3 text-sm text-on-surface bg-surface placeholder-on-surface-variant outline-none focus:border-primary transition-colors"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-on-surface mb-2">
                  Email de connexion <span className="text-error">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@entreprise.ma"
                  required
                  className="w-full border border-outline-variant rounded-xl px-4 py-3 text-sm text-on-surface bg-surface placeholder-on-surface-variant outline-none focus:border-primary transition-colors"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-semibold text-on-surface mb-2">
                  Mot de passe <span className="text-error">*</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 caractères"
                  required
                  minLength={8}
                  className="w-full border border-outline-variant rounded-xl px-4 py-3 text-sm text-on-surface bg-surface placeholder-on-surface-variant outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-on-surface mb-2">Secteur d'activité</label>
                <select
                  value={secteur}
                  onChange={(e) => setSecteur(e.target.value)}
                  className="w-full border border-outline-variant rounded-xl px-4 py-3 text-sm text-on-surface bg-surface outline-none focus:border-primary transition-colors"
                >
                  <option value="">— Choisir —</option>
                  {SECTEURS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-semibold text-on-surface mb-2">Ville</label>
                <input
                  type="text"
                  value={ville}
                  onChange={(e) => setVille(e.target.value)}
                  placeholder="ex. Rabat"
                  className="w-full border border-outline-variant rounded-xl px-4 py-3 text-sm text-on-surface bg-surface placeholder-on-surface-variant outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1 justify-center disabled:opacity-60"
              >
                {loading ? (
                  <span className="material-symbols-outlined text-xl animate-spin">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-xl">business</span>
                )}
                Créer le compte
              </button>
              <button type="button" onClick={() => navigate(-1)} className="btn-ghost">
                Annuler
              </button>
            </div>
          </form>
        </div>

        <div className="lg:w-72 lg:flex-shrink-0">
          <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl border border-primary/10 p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
              <h3 className="font-semibold text-primary">À noter</h3>
            </div>
            <ul className="space-y-3 text-sm text-on-surface-variant">
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-green-500 text-base mt-0.5 flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <span>Le compte est créé <strong>pré-validé</strong> — l'entreprise peut publier immédiatement.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-primary text-base mt-0.5 flex-shrink-0">mail</span>
                <span>Communiquez les identifiants à l'entreprise par email.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-orange-500 text-base mt-0.5 flex-shrink-0">lock</span>
                <span>Le mot de passe doit comporter au moins 8 caractères.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
