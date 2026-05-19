export default function SideNavBar() {
  return (
    <aside className="h-screen w-64 fixed left-0 top-0 bg-slate-100 dark:bg-slate-950 flex flex-col border-r border-slate-200/20 dark:border-slate-800/20 p-4 z-40">
      <div className="mb-8 px-2 flex items-center gap-2">
        <img
          src="/logo-enim-connect.svg"
          alt="EnimConnect Logo"
          className="w-12 h-12 object-contain"
        />
        <div>
          <h1 className="font-headline text-lg font-black text-blue-700 dark:text-blue-400 tracking-tight">
            EnimConnect
          </h1>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Recruiter Portal
          </p>
        </div>
      </div>

      <button className="mb-6 w-full py-3 px-4 bg-primary text-white font-semibold rounded-xl shadow-md flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-[0.98]">
        <span className="material-symbols-outlined">add</span>
        <span className="text-sm">+ Publier une offre</span>
      </button>

      <nav className="flex-1 space-y-2">
        <a
          className="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/30 hover:translate-x-1 transition-transform duration-200 rounded-lg group"
          href="#"
        >
          <span className="material-symbols-outlined group-hover:text-blue-600">
            dashboard
          </span>
          <span className="font-label text-sm font-semibold">
            Tableau de bord
          </span>
        </a>
        <a
          className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-800 text-blue-600 dark:text-indigo-300 rounded-lg shadow-sm active:scale-[0.98] transition-all"
          href="#"
        >
          <span className="material-symbols-outlined">work</span>
          <span className="font-label text-sm font-semibold">
            Vos offres de stages
          </span>
        </a>
        <a
          className="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/30 hover:translate-x-1 transition-transform duration-200 rounded-lg group"
          href="#"
        >
          <span className="material-symbols-outlined group-hover:text-blue-600">
            grade
          </span>
          <span className="font-label text-sm font-semibold">
            Candidats favoris
          </span>
        </a>
      </nav>

      <div className="mt-auto space-y-2 pt-4 border-t border-slate-200/20">
        <a
          className="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/30 rounded-lg group"
          href="#"
        >
          <span className="material-symbols-outlined">help</span>
          <span className="font-label text-sm font-semibold">Aide</span>
        </a>
        <a
          className="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/30 rounded-lg group"
          href="#"
        >
          <span className="material-symbols-outlined">logout</span>
          <span className="font-label text-sm font-semibold">Déconnexion</span>
        </a>
      </div>
    </aside>
  );
}
