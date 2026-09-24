'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function FollowButton({
  targetId,
  initialFollowing,
}: {
  targetId: string;
  initialFollowing: boolean;
}) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    if (following) {
      await supabase
        .from('follows')
        .delete()
        .match({ follower_id: userData.user.id, following_id: targetId });
      setFollowing(false);
    } else {
      await supabase
        .from('follows')
        .insert({ follower_id: userData.user.id, following_id: targetId });
      setFollowing(true);
    }
    setLoading(false);
    router.refresh();
  };

  return (
    <button onClick={toggle} disabled={loading} className={following ? 'btn-ghost' : 'btn-primary'}>
      {following ? 'Abonné·e ✓' : 'S’abonner'}
    </button>
  );
}
