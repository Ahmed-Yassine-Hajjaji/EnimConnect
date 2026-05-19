import { useEffect, useState } from "react";
import { api } from "../api/client";

interface Props {
  role: string | null;
  /** Extra classes for the wrapper div */
  className?: string;
}

export default function UserAvatar({ role, className = "" }: Props) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [initial, setInitial] = useState("?");

  useEffect(() => {
    if (!role) return;

    if (role === "etudiant") {
      api.getMonProfil()
        .then((data: any) => {
          setInitial((data.prenom?.[0] ?? data.email?.[0] ?? "E").toUpperCase());
          if (data.photo_url) setPhotoUrl(`${api.apiBase}${data.photo_url}`);
        })
        .catch(() => {});
    } else if (role === "entreprise") {
      api.getMonEntreprise()
        .then((data: any) => {
          setInitial((data.email?.[0] ?? "E").toUpperCase());
        })
        .catch(() => {});
    } else if (role === "club") {
      // club users have no profile endpoint — use email from JWT sub
      setInitial("C");
    }
  }, [role]);

  const base =
    role === "etudiant"
      ? "bg-gradient-to-br from-primary to-secondary"
      : role === "entreprise"
      ? "bg-gradient-to-br from-tertiary to-tertiary-container"
      : "bg-gradient-to-br from-primary to-secondary";

  if (photoUrl) {
    return (
      <div className={`w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 ${className}`}>
        <img
          src={photoUrl}
          alt="Profil"
          className="w-full h-full object-cover"
          onError={() => setPhotoUrl(null)}
        />
      </div>
    );
  }

  return (
    <div className={`w-9 h-9 rounded-xl ${base} flex items-center justify-center flex-shrink-0 ${className}`}>
      <span className="text-white text-sm font-bold">{initial}</span>
    </div>
  );
}
