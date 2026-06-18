'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { acceptInvite } from '@/lib/api/groups';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';

function JoinPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const code = searchParams.get('code');

  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [groupLink, setGroupLink] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const acceptMutation = useMutation({
    mutationFn: () => acceptInvite(code || ''),
    onSuccess: (result) => {
      setStatus('success');
      setGroupLink(`/portfolio/groups/${result.group_id}`);
    },
    onError: (err: Error) => {
      setStatus('error');
      const msg = err.message;
      if (msg.includes('INVITE_NOT_FOUND') || msg.includes('not found')) {
        setErrorMessage('Convite não encontrado. O link pode ser inválido.');
      } else if (msg.includes('INVITE_REVOKED') || msg.includes('revogado')) {
        setErrorMessage('Este convite foi revogado.');
      } else if (msg.includes('INVITE_EXPIRED') || msg.includes('expirado')) {
        setErrorMessage('Este convite expirou.');
      } else if (msg.includes('ALREADY_MEMBER') || msg.includes('já é membro')) {
        setErrorMessage('Você já é membro deste grupo.');
      } else if (msg.includes('401') || msg.includes('Não autorizado')) {
        setErrorMessage(
          'Você precisa estar logado para aceitar o convite.',
        );
      } else {
        setErrorMessage(err.message);
      }
    },
  });

  useEffect(() => {
    if (!code) {
      setStatus('error');
      setErrorMessage('Link de convite inválido: código não encontrado.');
    }
  }, [code]);

  function handleAccept() {
    if (!code) return;
    acceptMutation.mutate();
  }

  // No code provided
  if (!code) {
    return (
      <div className="mx-auto max-w-md pt-12">
        <Card className="p-8 text-center">
          <h1 className="mb-2 text-xl font-semibold text-content">
            Convite Inválido
          </h1>
          <p className="mb-6 text-sm text-content-muted">
            O link de convite não contém um código válido.
          </p>
          <Link href="/portfolio/groups">
            <Button variant="primary">Ir para Grupos</Button>
          </Link>
        </Card>
      </div>
    );
  }

  // Success state
  if (status === 'success') {
    return (
      <div className="mx-auto max-w-md pt-12">
        <Card className="p-8 text-center">
          <div className="mb-4 text-4xl">✓</div>
          <h1 className="mb-2 text-xl font-semibold text-content">
            Convite Aceito!
          </h1>
          <p className="mb-6 text-sm text-content-muted">
            Você agora faz parte do grupo.
          </p>
          <Link href={groupLink}>
            <Button variant="primary">Ver Grupo</Button>
          </Link>
        </Card>
      </div>
    );
  }

  // Error state
  if (status === 'error') {
    return (
      <div className="mx-auto max-w-md pt-12">
        <Card className="p-8 text-center">
          <h1 className="mb-2 text-xl font-semibold text-danger">
            Erro ao Aceitar Convite
          </h1>
          <p className="mb-6 text-sm text-content-muted">{errorMessage}</p>
          <Link href="/portfolio/groups">
            <Button variant="secondary">Ir para Grupos</Button>
          </Link>
        </Card>
      </div>
    );
  }

  // Idle state — show accept button
  return (
    <div className="mx-auto max-w-md pt-12">
      <Card className="p-8 text-center">
        <h1 className="mb-2 text-xl font-semibold text-content">
          Você foi convidado para um grupo!
        </h1>
        <p className="mb-6 text-sm text-content-muted">
          Aceite o convite para começar a compartilhar carteiras de
          investimento com o grupo.
        </p>
        <Button
          variant="primary"
          onClick={handleAccept}
          loading={acceptMutation.isPending}
        >
          Aceitar Convite
        </Button>
      </Card>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-48 items-center justify-center">
          <Spinner />
        </div>
      }
    >
      <JoinPageInner />
    </Suspense>
  );
}
