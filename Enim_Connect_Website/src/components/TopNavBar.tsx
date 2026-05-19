export default function TopNavBar() {
  return (
    <header className="sticky top-0 z-50 flex justify-between items-center w-full px-8 py-4 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/20 dark:border-slate-800/20">
      <div className="flex items-center gap-4">
        <h2 className="font-headline text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Gestion des candidatures
        </h2>
      </div>
      <div className="flex items-center gap-6">
        <div className="relative flex items-center">
          <span className="material-symbols-outlined absolute left-3 text-slate-400">
            search
          </span>
          <input
            className="pl-10 pr-4 py-2 bg-white/50 border-none rounded-full text-sm focus:ring-2 focus:ring-indigo-500 w-64"
            placeholder="Rechercher..."
            type="text"
          />
        </div>
        <div className="flex items-center gap-4">
          <button className="text-slate-500 hover:text-indigo-500 transition-colors relative">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <button className="text-slate-500 hover:text-indigo-500 transition-colors">
            <span className="material-symbols-outlined">settings</span>
          </button>
          <div className="w-10 h-10 rounded-full border-2 border-blue-100 overflow-hidden cursor-pointer hover:scale-105 transition-transform">
            <img
              alt="Company Profile"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCcrvwTXw-uF9t742xnH9einPLpcdNADh82naeXx7glCwjkw-X9VknU2if8yiu8ojVBVj7L6mj1vQwh11sTQeG9Zru7DZMtcWQs4JhtfOyjukcq7yI-n0eIPxNrUB3PX_0Jk5xjZphi8MU0nxTyCBfZpXbjH5vdduocpIyJTx5ZkUDaDobvG3AhPp2hmlEJ_NZ5ud9p2MCmQLKGF2OYJWqvrZpcnx1xrzhchxwpJDnvvF1dumEG1X46zA90osONEdoesaeiH6F-cmsP"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
