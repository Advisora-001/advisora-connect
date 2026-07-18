'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ProfileGateModal from '@/components/ProfileGateModal';

export function useProfileGate() {
  const { user } = useAuth();
  const router = useRouter();
  const [gate, setGate] = useState<null | 'auth'>(null);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  const requireAccess = (lawyerId: string) => {
    if (!user) {
      setGate('auth');
      return;
    }
    router.push(`/lawyers/${lawyerId}`);
  };

  const openGate = (mode: 'auth') => {
    setGate(mode);
  };

  const GateModal = (
    <ProfileGateModal
      open={gate !== null}
      onClose={() => setGate(null)}
    />
  );

  return { requireAccess, openGate, GateModal };
}