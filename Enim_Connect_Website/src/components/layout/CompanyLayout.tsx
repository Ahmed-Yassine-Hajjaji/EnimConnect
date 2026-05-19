import { useEffect } from "react";
import { Outlet, NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import NotificationBell from "../NotificationBell";
import UserAvatar from "../UserAvatar";

export default function CompanyLayout() {
  const navigate = useNavigate();
  const { isAuthenticated, role, logout } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) navigate("/", { replace: true });
    else if (role && role !== "entreprise") navigate("/", { replace: true });
  }, [isAuthenticated, role, navigate]);

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  return (
    <div className="min-h-screen bg-surface">
      <aside className="fixed left-0 top-0 h-full w-64 bg-surface-container-low border-r border-outline-variant flex flex-col z-30">
        <div className="p-6 border-b border-outline-variant">
          <Link to="/entreprise/tableau-de-bord" className="flex items-center gap-3">
            <img src="/logo-enim-connect.svg" className="w-12 h-12 object-contain" alt="EnimConnect Logo" />
            <div>
              <div className="font-headline font-bold text-on-surface text-base leading-tight">EnimConnect</div>
              <div className="text-xs text-on-surface-variant">Recruiter Portal</div>
            </div>
          </Link>
        </div>

        <div className="px-4 pt-4">
          <Link
            to="/entreprise/publier-offre"
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-lg">add_circle</span>
            Publier une offre
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider px-3 py-2">Navigation</p>

          {[
            { to: "/entreprise/tableau-de-bord", icon: "dashboard", label: "Tableau de bord" },
            { to: "/entreprise/mes-offres", icon: "work", label: "Mes offres" },
            { to: "/entreprise/candidats-favoris", icon: "favorite", label: "Base étudiants" },
            { to: "/entreprise/gestion-candidats", icon: "manage_accounts", label: "Gestion candidats" },
            { to: "/entreprise/profil", icon: "business", label: "Mon profil entreprise" },
          ].map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                }`
              }
            >
              <span className="material-symbols-outlined text-xl">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-outline-variant space-y-1">
          <NavLink
            to="/entreprise/aide"
            className={({ isActive }) =>
              `flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
              }`
            }
          >
            <span className="material-symbols-outlined text-xl">help_outline</span>
            Aide
          </NavLink>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-error hover:bg-error/10 transition-colors"
          >
            <span className="material-symbols-outlined text-xl">logout</span>
            Déconnexion
          </button>
        </div>
      </aside>

      <header className="fixed top-0 left-64 right-0 h-16 bg-surface/80 backdrop-blur-md border-b border-outline-variant flex items-center justify-end px-8 z-20">
        <div className="flex items-center gap-3">
          <NotificationBell />
          <UserAvatar role={role} />
        </div>
      </header>

      <div className="ml-64 pt-16">
        <Outlet />
      </div>
    </div>
  );
}
