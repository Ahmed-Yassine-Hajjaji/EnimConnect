import { useEffect, useState } from "react";
import { Outlet, NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import NotificationBell from "../NotificationBell";
import UserAvatar from "../UserAvatar";

const NAV_LINKS_ADMIN = [
  { to: "/admin/offres", icon: "work", label: "Offres de stage" },
  { to: "/admin/interface", icon: "task_alt", label: "Validation des offres" },
  { to: "/admin/entreprises", icon: "business", label: "Validation entreprises" },
  { to: "/admin/creer-entreprise", icon: "add_business", label: "Créer compte entreprise" },
];

const NAV_LINKS_SCOLARITE = [
  { to: "/admin/etudiants", icon: "people", label: "Base étudiants" },
  { to: "/admin/statistiques", icon: "analytics", label: "Statistiques" },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const { isAuthenticated, role, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) navigate("/", { replace: true });
    else if (role && role !== "club") navigate("/", { replace: true });
  }, [isAuthenticated, role, navigate]);

  function closeOnMobile() {
    setSidebarOpen(false);
  }

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
      isActive
        ? "bg-primary/10 text-primary"
        : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
    }`;

  const sidebarContent = (
    <>
      <div className="p-6 border-b border-outline-variant">
        <Link to="/admin" className="flex items-center gap-3" onClick={closeOnMobile}>
          <img src="/logo-enim-connect.svg" className="w-12 h-12 object-contain" alt="EnimConnect Logo" />
          <div>
            <div className="font-headline font-bold text-lg leading-tight ai-gradient-text">EnimConnect</div>
            <div className="text-xs text-on-surface-variant font-medium">Dashboard Club</div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider px-3 py-2">Administration</p>
        {NAV_LINKS_ADMIN.map(({ to, icon, label }) => (
          <NavLink key={to} to={to} className={navLinkClass} onClick={closeOnMobile}>
            <span className="material-symbols-outlined text-xl">{icon}</span>
            {label}
          </NavLink>
        ))}

        <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider px-3 py-2 mt-2">Scolarité</p>
        {NAV_LINKS_SCOLARITE.map(({ to, icon, label }) => (
          <NavLink key={to} to={to} className={navLinkClass} onClick={closeOnMobile}>
            <span className="material-symbols-outlined text-xl">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-outline-variant space-y-1">
        <NavLink to="/admin/aide" className={navLinkClass} onClick={closeOnMobile}>
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
    </>
  );

  return (
    <div className="min-h-screen bg-surface">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full w-72 bg-surface-container-low border-r border-outline-variant flex flex-col z-50 transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        {sidebarContent}
      </aside>

      {/* Header */}
      <header className="fixed top-0 left-0 lg:left-72 right-0 h-16 bg-surface/80 backdrop-blur-md border-b border-outline-variant flex items-center justify-between lg:justify-end px-4 lg:px-8 z-30">
        <button
          className="lg:hidden p-2 rounded-xl hover:bg-surface-container transition-colors"
          onClick={() => setSidebarOpen(true)}
          aria-label="Ouvrir le menu"
        >
          <span className="material-symbols-outlined text-on-surface">menu</span>
        </button>

        <div className="flex items-center gap-3">
          <NotificationBell />
          <UserAvatar role={role} />
        </div>
      </header>

      {/* Contenu principal */}
      <div className="lg:ml-72 pt-16">
        <Outlet />
      </div>
    </div>
  );
}
