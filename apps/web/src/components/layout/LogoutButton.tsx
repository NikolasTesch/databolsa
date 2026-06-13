'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth/context';
import { Button } from '@/components/ui/Button';

export function LogoutButton() {
  const { logout } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      loading={loading}
      onClick={handleLogout}
      aria-label="Sair da conta"
    >
      Sair
    </Button>
  );
}
