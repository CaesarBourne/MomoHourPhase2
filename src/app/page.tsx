'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Phase 2's portal has one real screen (Windows) - land straight there
 * instead of duplicating Phase 1's dashboard. */
export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/windows');
  }, [router]);

  return null;
}
