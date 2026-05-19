import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      const savedRole =
        JSON.parse(atob(localStorage.getItem("access_token")!.split(".")[1])).role;
      if (savedRole === "etudiant") navigate("/etudiant/tableau-de-bord");
      else if (savedRole === "entreprise") navigate("/entreprise/tableau-de-bord");
      else if (savedRole === "club") navigate("/admin/interface");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-secondary to-tertiary"></div>
        <div className="relative z-10 flex flex-col justify-end p-12 text-white">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-8">
              <img
                src="/logo-enim-connect.svg"
                className="w-12 h-12 object-contain"
                alt="EnimConnect Logo"
              />
              <span className="font-headline font-bold text-xl">EnimConnect</span>
            </div>
            <h1 className="font-headline font-extrabold text-4xl leading-tight mb-4">
              Propulsez votre<br />carrière avec l'IA
            </h1>
            <p className="text-white/80 text-lg leading-relaxed max-w-md">
              Découvrez des opportunités de stages personnalisées grâce à notre
              moteur de recommandation intelligent.
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="font-headline font-bold text-2xl">500+</div>
              <div className="text-white/70 text-sm">Offres de stages</div>
            </div>
            <div className="w-px h-10 bg-white/30"></div>
            <div className="text-center">
              <div className="font-headline font-bold text-2xl">200+</div>
              <div className="text-white/70 text-sm">Entreprises partenaires</div>
            </div>
            <div className="w-px h-10 bg-white/30"></div>
            <div className="text-center">
              <div className="font-headline font-bold text-2xl">95%</div>
              <div className="text-white/70 text-sm">Taux de satisfaction</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-surface">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <img
              src="/logo-enim-connect.svg"
              className="w-12 h-12 object-contain bg-white rounded-xl shadow-lg"
              alt="EnimConnect Logo"
            />
            <div>
              <div className="font-headline font-bold text-xl text-on-surface leading-tight">
                EnimConnect
              </div>
              <div className="text-xs text-on-surface-variant">
                Plateforme de stages intelligente
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="font-headline font-bold text-xl text-on-surface mb-1">Connexion</h2>
            <p className="text-sm text-on-surface-variant">Accédez à votre espace personnel</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-on-surface mb-2">
                Adresse email
              </label>
              <div className="flex items-center gap-3 border border-outline-variant rounded-xl px-4 py-3 focus-within:border-primary transition-colors bg-surface-container-low">
                <span className="material-symbols-outlined text-on-surface-variant text-xl">
                  mail
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  required
                  className="flex-1 bg-transparent text-sm text-on-surface placeholder-on-surface-variant outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-on-surface mb-2">
                Mot de passe
              </label>
              <div className="flex items-center gap-3 border border-outline-variant rounded-xl px-4 py-3 focus-within:border-primary transition-colors bg-surface-container-low">
                <span className="material-symbols-outlined text-on-surface-variant text-xl">
                  lock
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="flex-1 bg-transparent text-sm text-on-surface placeholder-on-surface-variant outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-secondary text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <span className="material-symbols-outlined text-xl animate-spin">
                  progress_activity
                </span>
              ) : (
                <span className="material-symbols-outlined text-xl">login</span>
              )}
              Se connecter
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
