import { useEffect } from "react";
import { Outlet, NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import NotificationBell from "../NotificationBell";
import UserAvatar from "../UserAvatar";

export default function AdminLayout() {
  const navigate = useNavigate();
  const { isAuthenticated, role, logout } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) navigate("/", { replace: true });
    else if (role && role !== "club") navigate("/", { replace: true });
  }, [isAuthenticated, role, navigate]);

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  return (
    <div className="min-h-screen bg-surface">
      <aside className="fixed left-0 top-0 h-full w-72 bg-surface-container-low border-r border-outline-variant flex flex-col z-30">
        <div className="p-6 border-b border-outline-variant">
          <Link to="/admin" className="flex items-center gap-3">
            <img src="/logo-enim-connect.svg" className="w-12 h-12 object-contain" alt="EnimConnect Logo" />
            <div>
              <div className="font-headline font-bold text-lg leading-tight ai-gradient-text">EnimConnect</div>
              <div className="text-xs text-on-surface-variant font-medium">Dashboard Club</div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider px-3 py-2">Administration</p>

          <NavLink
            to="/admin/offres"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
              }`
            }
          >
            <span className="material-symbols-outlined text-xl">work</span>
            Offres de stage
          </NavLink>

          <NavLink
            to="/admin/interface"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
              }`
            }
          >
            <span className="material-symbols-outlined text-xl">task_alt</span>
            Validation des offres
          </NavLink>

          <NavLink
            to="/admin/entreprises"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
              }`
            }
          >
            <span className="material-symbols-outlined text-xl">business</span>
            Validation entreprises
          </NavLink>

          <NavLink
            to="/admin/creer-entreprise"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
              }`
            }
          >
            <span className="material-symbols-outlined text-xl">add_business</span>
            Créer compte entreprise
          </NavLink>

          <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider px-3 py-2 mt-2">Scolarité</p>

          <NavLink
            to="/admin/etudiants"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
              }`
            }
          >
            <span className="material-symbols-outlined text-xl">people</span>
            Base étudiants
          </NavLink>

          <NavLink
            to="/admin/statistiques"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
              }`
            }
          >
            <span className="material-symbols-outlined text-xl">analytics</span>
            Statistiques
          </NavLink>
        </nav>

        <div className="p-4 border-t border-outline-variant space-y-1">
          <NavLink
            to="/admin/aide"
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

      <header className="fixed top-0 left-72 right-0 h-16 bg-surface/80 backdrop-blur-md border-b border-outline-variant flex items-center justify-end px-8 z-20">
        <div className="flex items-center gap-3">
          <NotificationBell />
          <UserAvatar role={role} />
        </div>
      </header>

      <div className="ml-72 pt-16">
        <Outlet />
      </div>
    </div>
  );
}
