'use client';

import { useEffect, useState } from 'react';
import { fetchTodayUsage } from '@/lib/quota';
import { QUOTAS } from '@/lib/constants';
import type { Usage } from '@/lib/types';

/** Badge du mode gratuit : consommation du jour (musique/vidéo). */
export default function QuotaBadge() {
  const [usage, setUsage] = useState<Usage>({
    media_plays: 0,
    media_limit: QUOTAS.mediaPerDay,
    books_opened: 0,
    books_limit: QUOTAS.booksPerMonth,
  });

  useEffect(() => {
    fetchTodayUsage().then(setUsage).catch(() => {});
  }, []);

  const left = Math.max(usage.media_limit - usage.media_plays, 0);

  return (
    <div
      className="rounded-full bg-lify-50 px-3 py-1 text-xs font-medium text-lify-700"
      title={`Mode gratuit : ${left} écoute(s)/lecture(s) restantes aujourd'hui, ${usage.books_limit - usage.books_opened} nouveau(x) livre(s) ce mois.`}
    >
      🎧 {left} restantes
    </div>
  );
}
