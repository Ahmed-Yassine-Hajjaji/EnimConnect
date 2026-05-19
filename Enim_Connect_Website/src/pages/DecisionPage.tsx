import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import type { DecisionInfo } from "../api/client";

type PageState = "loading" | "error" | "already_done" | "form" | "submitting" | "confirmed";

export default function DecisionPage() {
  const { validation_id } = useParams<{ validation_id: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const chef_id = searchParams.get("chef_id") ?? "";

  const [state, setState] = useState<PageState>("loading");
  const [info, setInfo] = useState<DecisionInfo | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [action, setAction] = useState<"valider" | "refuser" | null>(null);
  const [motif, setMotif] = useState("");
  const [motifError, setMotifError] = useState("");
  const [confirmMsg, setConfirmMsg] = useState("");

  useEffect(() => {
    if (!validation_id || !token || !chef_id) {
      setState("error");
      setErrorMsg("Lien invalide — paramètres manquants.");
      return;
    }

    api
      .getDecisionInfo(validation_id, token, chef_id)
      .then((data) => {
        setInfo(data);
        setState(data.statut !== "en_attente" ? "already_done" : "form");
      })
      .catch((e: Error) => {
        setState("error");
        setErrorMsg(
          e.message.includes("expiré") || e.message.includes("invalide")
            ? "Ce lien est invalide ou a expiré (48h). Contactez le club EnimConnect."
            : e.message || "Une erreur est survenue."
        );
      });
  }, [validation_id, token, chef_id]);

  async function handleSubmit() {
    if (!action || !validation_id) return;
    if (action === "refuser" && !motif.trim()) {
      setMotifError("Le motif est obligatoire pour un refus.");
      return;
    }
    setMotifError("");
    setState("submitting");
    try {
      const result = await api.soumettreDecision(validation_id, {
        token,
        chef_id,
        action,
        motif: motif.trim() || undefined,
      });
      setConfirmMsg(result.message);
      setState("confirmed");
    } catch (e: unknown) {
      setState("form");
      setErrorMsg(e instanceof Error ? e.message : "Erreur lors de la soumission.");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-surface to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-white border border-outline-variant rounded-full px-4 py-2 shadow-sm mb-4">
            <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
              school
            </span>
            <span className="font-semibold text-sm text-on-surface">EnimConnect</span>
          </div>
          <h1 className="font-headline font-bold text-2xl text-on-surface">Validation d'offre de stage</h1>
          <p className="text-sm text-on-surface-variant mt-1">Plateforme ENSMR</p>
        </div>

        <div className="bg-white rounded-2xl border border-outline-variant shadow-lg overflow-hidden">
          {/* Loading */}
          {state === "loading" && (
            <div className="p-12 text-center">
              <span className="material-symbols-outlined text-4xl text-primary animate-spin block mb-3">
                progress_activity
              </span>
              <p className="text-on-surface-variant">Vérification du lien…</p>
            </div>
          )}

          {/* Error */}
          {state === "error" && (
            <div className="p-10 text-center">
              <span className="text-5xl block mb-4">🔒</span>
              <h2 className="font-headline font-bold text-xl text-red-700 mb-3">Lien invalide ou expiré</h2>
              <p className="text-on-surface-variant text-sm leading-relaxed">{errorMsg}</p>
            </div>
          )}

          {/* Already processed */}
          {state === "already_done" && info && (
            <div className="p-10 text-center">
              <span className="text-5xl block mb-4">
                {info.statut === "validee" ? "✅" : "🚫"}
              </span>
              <h2 className="font-headline font-bold text-xl text-on-surface mb-2">Déjà traitée</h2>
              <p className="text-on-surface-variant text-sm">
                L'offre{" "}
                <strong className="text-on-surface">« {info.annonce.titre} »</strong> a déjà été{" "}
                {info.statut === "validee" ? (
                  <span className="text-green-700 font-semibold">validée</span>
                ) : (
                  <span className="text-red-700 font-semibold">refusée</span>
                )}{" "}
                pour le <strong className="text-on-surface">{info.departement}</strong>.
              </p>
            </div>
          )}

          {/* Decision form */}
          {(state === "form" || state === "submitting") && info && (
            <>
              {/* Offer summary */}
              <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-outline-variant p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white border border-outline-variant flex items-center justify-center font-bold text-primary text-base shadow-sm shrink-0">
                    {info.annonce.nom_entreprise.slice(0, 2).toUpperCase() || "??"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-headline font-bold text-lg text-on-surface leading-tight">
                      {info.annonce.titre}
                    </h2>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-on-surface-variant">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-base">business</span>
                        {info.annonce.nom_entreprise}
                      </span>
                      {info.annonce.duree_mois && (
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-base">schedule</span>
                          {info.annonce.duree_mois} mois
                        </span>
                      )}
                    </div>
                    <span className="inline-block mt-2 px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-xl">
                      {info.departement}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="p-6 border-b border-outline-variant">
                <h3 className="font-semibold text-sm text-on-surface mb-2">Description du stage</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap line-clamp-6">
                  {info.annonce.description}
                </p>
              </div>

              {/* Decision buttons */}
              <div className="p-6">
                <p className="text-sm font-semibold text-on-surface mb-4">Votre décision pour ce département :</p>

                {errorMsg && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
                    {errorMsg}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <button
                    onClick={() => { setAction("valider"); setMotif(""); setMotifError(""); }}
                    disabled={state === "submitting"}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 font-semibold text-sm transition-all ${
                      action === "valider"
                        ? "bg-green-600 border-green-600 text-white shadow-md"
                        : "border-green-300 text-green-700 hover:bg-green-50"
                    }`}
                  >
                    <span className="material-symbols-outlined text-xl">check_circle</span>
                    Valider l'offre
                  </button>

                  <button
                    onClick={() => { setAction("refuser"); setMotifError(""); }}
                    disabled={state === "submitting"}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 font-semibold text-sm transition-all ${
                      action === "refuser"
                        ? "bg-red-600 border-red-600 text-white shadow-md"
                        : "border-red-300 text-red-700 hover:bg-red-50"
                    }`}
                  >
                    <span className="material-symbols-outlined text-xl">cancel</span>
                    Refuser l'offre
                  </button>
                </div>

                {/* Motif textarea */}
                {action && (
                  <div className="mb-5">
                    <label className="block text-sm font-semibold text-on-surface mb-2">
                      {action === "refuser" ? (
                        <>
                          Motif du refus{" "}
                          <span className="text-red-500">*</span>
                        </>
                      ) : (
                        "Commentaire (optionnel)"
                      )}
                    </label>
                    <textarea
                      value={motif}
                      onChange={(e) => { setMotif(e.target.value); setMotifError(""); }}
                      placeholder={
                        action === "refuser"
                          ? "Expliquez pourquoi cette offre ne correspond pas aux critères du département…"
                          : "Ajoutez un commentaire si vous le souhaitez…"
                      }
                      rows={4}
                      className={`w-full border rounded-xl p-3 text-sm resize-none outline-none transition-colors font-body ${
                        motifError
                          ? "border-red-400 focus:border-red-500"
                          : "border-outline-variant focus:border-primary"
                      }`}
                    />
                    {motifError && (
                      <p className="text-red-600 text-xs mt-1">{motifError}</p>
                    )}
                  </div>
                )}

                {/* Submit */}
                {action && (
                  <button
                    onClick={handleSubmit}
                    disabled={state === "submitting"}
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-60 ${
                      action === "valider"
                        ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:opacity-90"
                        : "bg-gradient-to-r from-red-600 to-rose-600 hover:opacity-90"
                    }`}
                  >
                    {state === "submitting" ? (
                      <span className="material-symbols-outlined text-xl animate-spin">progress_activity</span>
                    ) : (
                      <span className="material-symbols-outlined text-xl">
                        {action === "valider" ? "check_circle" : "cancel"}
                      </span>
                    )}
                    {state === "submitting"
                      ? "Enregistrement…"
                      : action === "valider"
                      ? "Confirmer la validation"
                      : "Confirmer le refus"}
                  </button>
                )}

                <p className="text-xs text-on-surface-variant text-center mt-4">
                  Ce lien est valable 48 heures et ne peut être utilisé qu'une seule fois.
                </p>
              </div>
            </>
          )}

          {/* Confirmation */}
          {state === "confirmed" && (
            <div className="p-10 text-center">
              <span className="text-5xl block mb-4">
                {action === "valider" ? "✅" : "🚫"}
              </span>
              <h2
                className={`font-headline font-bold text-xl mb-3 ${
                  action === "valider" ? "text-green-700" : "text-red-700"
                }`}
              >
                {action === "valider" ? "Offre validée !" : "Offre refusée"}
              </h2>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                {confirmMsg}
              </p>
              <p className="text-xs text-on-surface-variant mt-4">
                L'entreprise a été notifiée par email. Merci pour votre réponse.
              </p>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-on-surface-variant mt-4">
          EnimConnect · Plateforme de stages ENSMR · Ce lien vous a été envoyé par le club EnimConnect.
        </p>
      </div>
    </div>
  );
}
