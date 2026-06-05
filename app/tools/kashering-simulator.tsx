/**
 * Kashering simulator — opens the native Kosharot chat directly on the
 * "simulator" topic, so users get a guided chat-style Q&A flow instead of
 * an embedded webpage.
 */
import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function KasheringSimulatorScreen() {
  const router = useRouter();
  useEffect(() => {
    // Replace (not push) so back button skips this redirect screen.
    router.replace('/tools/ask-chavruta?topic=simulator' as any);
  }, [router]);
  return null;
}
