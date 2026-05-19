import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type CVProfile } from '../../api/client';
import { NOMS_DEPARTEMENTS, DEPT_TO_FILIERES } from '../../constants/ensmr';

function ChangePasswordSection() {
  const [ancien, setAncien] = useState('');
  const [nouveau, setNouveau] = useState('');
  const [confirmer, setConfirmer] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSuccess(''); setError('');
    if (nouveau !== confirmer) { setError('Les mots de passe ne correspondent pas.'); return; }
    if (nouveau.length < 8) { setError('Le nouveau mot de passe doit contenir au moins 8 caractères.'); return; }
    setSaving(true);
    try {
      await api.changePassword(ancien, nouveau);
      setSuccess('Mot de passe modifié avec succès.');
      setAncien(''); setNouveau(''); setConfirmer('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors du changement de mot de passe');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-surface-container-low rounded-2xl border border-outline-variant p-6 space-y-4 mt-6">
      <h2 className="font-headline font-bold text-lg text-on-surface">Changer le mot de passe</h2>
      {success && <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl flex items-center gap-2"><span className="material-symbols-outlined text-base">check_circle</span>{success}</div>}
      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center gap-2"><span className="material-symbols-outlined text-base">error</span>{error}</div>}
      <div>
        <label className="block text-sm font-semibold text-on-surface mb-1.5">Mot de passe actuel</label>
        <input type="password" value={ancien} onChange={(e) => setAncien(e.target.value)} required
          className="w-full border border-outline-variant rounded-xl px-4 py-2.5 text-sm bg-surface outline-none focus:border-primary" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-on-surface mb-1.5">Nouveau mot de passe</label>
        <input type="password" value={nouveau} onChange={(e) => setNouveau(e.target.value)} required
          className="w-full border border-outline-variant rounded-xl px-4 py-2.5 text-sm bg-surface outline-none focus:border-primary" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-on-surface mb-1.5">Confirmer le nouveau mot de passe</label>
        <input type="password" value={confirmer} onChange={(e) => setConfirmer(e.target.value)} required
          className="w-full border border-outline-variant rounded-xl px-4 py-2.5 text-sm bg-surface outline-none focus:border-primary" />
      </div>
      <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
        <span className="material-symbols-outlined text-xl">{saving ? 'progress_activity' : 'lock'}</span>
        {saving ? 'Modification…' : 'Modifier le mot de passe'}
      </button>
    </form>
  );
}

interface Profil {
  id: string; nom: string; prenom: string; email?: string;
  telephone?: string; photo_url?: string; filiere?: string;
  departement?: string; niveau?: string;
  competences: string[]; langues: string[];
}

const NIVEAUX = ['1A', '2A', '3A'];

export default function ProfilCandidat() {
  const navigate = useNavigate();
  const photoRef = useRef<HTMLInputElement>(null);
  const cvRef = useRef<HTMLInputElement>(null);

  const [profil, setProfil] = useState<Profil | null>(null);
  const [cv, setCv] = useState<CVProfile | null>(null);
  const [consentementIa, setConsentementIa] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingCv, setUploadingCv] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Form state
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [filiere, setFiliere] = useState('');
  const [departement, setDepartement] = useState('');
  const [niveau, setNiveau] = useState('');
  const [competencesStr, setCompetencesStr] = useState('');
  const [languesStr, setLanguesStr] = useState('');

  useEffect(() => {
    Promise.all([
      api.getMonProfil() as Promise<Profil>,
      api.getMonCV().catch(() => null) as Promise<CV | null>,
    ]).then(([p, c]) => {
      setProfil(p); setCv(c);
      setNom(p.nom); setPrenom(p.prenom);
      setTelephone(p.telephone ?? '');
      setFiliere(p.filiere ?? '');
      setDepartement(p.departement ?? '');
      setNiveau(p.niveau ?? '');
      setCompetencesStr((p.competences ?? []).join(', '));
      setLanguesStr((p.langues ?? []).join(', '));
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess('');
    try {
      const body: Record<string, unknown> = { nom, prenom };
      if (telephone) body.telephone = telephone;
      if (filiere) body.filiere = filiere;
      if (departement) body.departement = departement;
      if (niveau) body.niveau = niveau;
      body.competences = competencesStr.split(',').map((s) => s.trim()).filter(Boolean);
      body.langues = languesStr.split(',').map((s) => s.trim()).filter(Boolean);
      const updated = await api.updateMonProfil(body) as Profil;
      setProfil(updated);
      setSuccess('Profil mis à jour avec succès');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setSaving(false);
    }
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setUploadingPhoto(true);
    try {
      const res = await api.uploadPhoto(file) as { photo_url: string };
      setProfil((p) => p ? { ...p, photo_url: res.photo_url } : p);
      setSuccess('Photo mise à jour');
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Erreur'); }
    finally { setUploadingPhoto(false); }
  }

  async function handleCvChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    if (!consentementIa) {
      setError("Vous devez accepter le consentement IA pour uploader votre CV.");
      return;
    }
    setUploadingCv(true); setSuccess(''); setError('');
    try {
      await api.uploadCV(file, consentementIa);
      setSuccess('CV uploadé ! L\'analyse IA est en cours en arrière-plan (quelques secondes).');
      setTimeout(async () => {
        const newCv = await api.getMonCV().catch(() => null) as CVProfile | null;
        if (newCv) setCv(newCv);
      }, 5000);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Erreur'); }
    finally { setUploadingCv(false); }
  }

  const initiales = profil ? `${profil.prenom?.[0] ?? ''}${profil.nom?.[0] ?? ''}`.toUpperCase() : '?';

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen text-on-surface-variant">
      <span className="material-symbols-outlined animate-spin text-3xl">progress_activity</span>
    </div>
  );

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-on-surface mb-6">
        <span className="material-symbols-outlined text-xl">arrow_back</span>Retour
      </button>

      <h1 className="font-headline font-extrabold text-3xl text-on-surface mb-6">Mon profil</h1>

      {success && <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm">{success}</div>}
      {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>}

      <div className="grid grid-cols-3 gap-6">
        {/* Left */}
        <div className="space-y-4">
          {/* Photo + identity */}
          <div className="bg-surface-container-low rounded-2xl border border-outline-variant p-6 text-center">
            <div className="relative inline-block mb-4">
              {profil?.photo_url ? (
                <img src={`${api.apiBase}${profil.photo_url}`} className="w-24 h-24 rounded-2xl object-cover mx-auto" alt="" />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-2xl font-bold mx-auto">
                  {initiales}
                </div>
              )}
              <button onClick={() => photoRef.current?.click()}
                disabled={uploadingPhoto}
                className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white shadow-md hover:opacity-90">
                <span className="material-symbols-outlined text-sm">{uploadingPhoto ? 'progress_activity' : 'camera_alt'}</span>
              </button>
              <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </div>
            <div className="font-headline font-bold text-lg text-on-surface">{profil?.prenom} {profil?.nom}</div>
            <div className="text-sm text-on-surface-variant mt-0.5">{profil?.email}</div>
            {profil?.filiere && <div className="text-xs text-on-surface-variant mt-1">{profil.filiere}{profil.niveau ? ` · ${profil.niveau}` : ''}</div>}
          </div>

          {/* CV */}
          <div className="bg-surface-container-low rounded-2xl border border-outline-variant p-5">
            <h3 className="font-semibold text-on-surface mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">description</span>
              Mon CV
            </h3>
            {cv ? (
              <div className="space-y-3">
                <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-green-600 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    <span className="text-xs font-semibold text-green-700">CV chargé</span>
                  </div>
                  <div className="text-xs text-green-600">Uploadé le {new Date(cv.uploaded_at).toLocaleDateString('fr-FR')}</div>
                </div>
                {cv.description_ia && (
                  <div className="p-3 bg-primary/5 border border-primary/10 rounded-xl">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="material-symbols-outlined text-primary text-sm">auto_awesome</span>
                      <span className="text-xs font-semibold text-primary">Analyse IA</span>
                    </div>
                    <p className="text-xs text-on-surface-variant leading-relaxed">{cv.description_ia}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2 block">upload_file</span>
                <p className="text-xs text-on-surface-variant mb-3">Uploadez votre CV PDF pour activer le matching IA</p>
              </div>
            )}
            {/* Consentement RGPD */}
            <label className="mt-3 flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={consentementIa}
                onChange={(e) => setConsentementIa(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-primary flex-shrink-0"
              />
              <span className="text-xs text-on-surface-variant leading-relaxed">
                J'accepte que mon CV soit analysé par une IA tierce (OpenAI) à des fins de matching de stage.{' '}
                <span className="text-error font-medium">Requis</span>
              </span>
            </label>
            <button
              onClick={() => consentementIa ? cvRef.current?.click() : setError("Veuillez accepter le consentement IA.")}
              disabled={uploadingCv}
              className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 border-2 border-primary text-primary text-sm font-semibold rounded-xl hover:bg-primary/5 transition-colors disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-base">{uploadingCv ? 'progress_activity' : 'upload'}</span>
              {uploadingCv ? 'Analyse en cours…' : cv ? 'Mettre à jour le CV' : 'Uploader mon CV'}
            </button>
            <input ref={cvRef} type="file" accept="application/pdf" className="hidden" onChange={handleCvChange} />
          </div>
        </div>

        {/* Right — edit form */}
        <div className="col-span-2">
          <form onSubmit={handleSave} className="bg-surface-container-low rounded-2xl border border-outline-variant p-6 space-y-5">
            <h2 className="font-headline font-bold text-lg text-on-surface">Informations personnelles</h2>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Prénom', val: prenom, set: setPrenom },
                { label: 'Nom', val: nom, set: setNom },
              ].map(({ label, val, set }) => (
                <div key={label}>
                  <label className="block text-sm font-semibold text-on-surface mb-1.5">{label}</label>
                  <input value={val} onChange={(e) => set(e.target.value)}
                    className="w-full border border-outline-variant rounded-xl px-4 py-2.5 text-sm bg-surface outline-none focus:border-primary" />
                </div>
              ))}
            </div>

            <div>
              <label className="block text-sm font-semibold text-on-surface mb-1.5">Téléphone</label>
              <input value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="+212 6XX XXX XXX"
                className="w-full border border-outline-variant rounded-xl px-4 py-2.5 text-sm bg-surface outline-none focus:border-primary" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-1.5">Département</label>
                <select value={departement} onChange={(e) => { setDepartement(e.target.value); setFiliere(''); }}
                  className="w-full border border-outline-variant rounded-xl px-4 py-2.5 text-sm bg-surface outline-none focus:border-primary">
                  <option value="">— Choisir —</option>
                  {NOMS_DEPARTEMENTS.map((d) => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-1.5">Niveau</label>
                <select value={niveau} onChange={(e) => setNiveau(e.target.value)}
                  className="w-full border border-outline-variant rounded-xl px-4 py-2.5 text-sm bg-surface outline-none focus:border-primary">
                  <option value="">— Choisir —</option>
                  {NIVEAUX.map((n) => <option key={n}>{n}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-on-surface mb-1.5">Filière</label>
              <select value={filiere} onChange={(e) => setFiliere(e.target.value)}
                disabled={!departement}
                className="w-full border border-outline-variant rounded-xl px-4 py-2.5 text-sm bg-surface outline-none focus:border-primary disabled:opacity-50">
                <option value="">— {departement ? 'Choisir une filière' : 'Choisissez un département d\'abord'} —</option>
                {(DEPT_TO_FILIERES[departement] ?? []).map((f) => <option key={f}>{f}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-on-surface mb-1.5">
                Compétences <span className="font-normal text-on-surface-variant">(séparées par des virgules)</span>
              </label>
              <input value={competencesStr} onChange={(e) => setCompetencesStr(e.target.value)}
                placeholder="Python, React, Machine Learning, SQL…"
                className="w-full border border-outline-variant rounded-xl px-4 py-2.5 text-sm bg-surface outline-none focus:border-primary" />
              {competencesStr && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {competencesStr.split(',').map((s) => s.trim()).filter(Boolean).map((s) => (
                    <span key={s} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-lg">{s}</span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-on-surface mb-1.5">
                Langues <span className="font-normal text-on-surface-variant">(séparées par des virgules)</span>
              </label>
              <input value={languesStr} onChange={(e) => setLanguesStr(e.target.value)}
                placeholder="Arabe, Français, Anglais…"
                className="w-full border border-outline-variant rounded-xl px-4 py-2.5 text-sm bg-surface outline-none focus:border-primary" />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving}
                className="btn-primary flex-1 justify-center disabled:opacity-60">
                <span className="material-symbols-outlined text-xl">{saving ? 'progress_activity' : 'save'}</span>
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
              <button type="button" onClick={() => navigate(-1)} className="btn-ghost">Annuler</button>
            </div>
          </form>

          <ChangePasswordSection />
        </div>
      </div>
    </div>
  );
}
