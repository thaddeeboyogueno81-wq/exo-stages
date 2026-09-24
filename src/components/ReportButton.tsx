'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Target = 'post' | 'message' | 'profile' | 'media';

const REASONS = [
  'Contenu protégé par le droit d’auteur (sans licence)',
  'Contenu violent ou choquant',
  'Harcèlement ou discours haineux',
  'Spam ou arnaque',
  'Autre',
];

/** Bouton de signalement — procédure de retrait sous 48 h (cahier des charges, §6). */
export default function ReportButton({
  targetType,
  targetId,
}: {
  targetType: Target;
  targetId: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setLoading(false);
      return;
    }
    await supabase.from('reports').insert({
      reporter_id: userData.user.id,
      target_type: targetType,
      target_id: targetId,
      reason,
    });
    setSent(true);
    setLoading(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-slate-400 hover:text-red-600"
        aria-label="Signaler"
      >
        ⚑ Signaler
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
        >
          <div
            className="card w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {sent ? (
              <div className="text-center">
                <p className="text-3xl">✅</p>
                <h2 className="mt-2 text-lg font-semibold">Signalement envoyé</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Notre équipe de modération examine les signalements en moins
                  de 48 heures. Merci de garder Lify propre.
                </p>
                <button onClick={() => setOpen(false)} className="btn-primary mt-5 w-full">
                  Fermer
                </button>
              </div>
            ) : (
              <form onSubmit={submit}>
                <h2 className="text-lg font-semibold">Signaler ce contenu</h2>
                <div className="mt-4 space-y-2">
                  {REASONS.map((r) => (
                    <label key={r} className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="reason"
                        value={r}
                        checked={reason === r}
                        onChange={() => setReason(r)}
                        required
                      />
                      {r}
                    </label>
                  ))}
                </div>
                <div className="mt-5 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="btn-ghost flex-1"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !reason}
                    className="btn-primary flex-1"
                  >
                    {loading ? 'Envoi…' : 'Envoyer'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
