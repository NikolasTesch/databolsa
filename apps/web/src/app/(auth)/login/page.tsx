'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth/context';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
});

type FormValues = z.infer<typeof schema>;

const shakeVariants = {
  idle: { x: 0 },
  shake: {
    x: [0, -10, 10, -10, 10, -6, 6, 0],
    transition: { duration: 0.5 },
  },
};

export default function LoginPage() {
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [shaking, setShaking] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const triggerShake = () => {
    setShaking(true);
    setTimeout(() => setShaking(false), 600);
  };

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    setServerError(null);
    try {
      await login(values.email, values.password);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao fazer login';
      setServerError(msg);
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <motion.div
        className="w-full max-w-sm"
        variants={shakeVariants}
        animate={shaking ? 'shake' : 'idle'}
      >
        <Card>
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold text-content">DataBolsa</h1>
            <p className="mt-1 text-sm text-content-muted">Entre na sua conta</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
            <Input
              label="E-mail"
              type="email"
              autoComplete="email"
              {...register('email')}
              error={errors.email?.message}
            />
            <Input
              label="Senha"
              type="password"
              autoComplete="current-password"
              {...register('password')}
              error={errors.password?.message}
            />

            {serverError && (
              <p className="rounded-lg bg-loss-surface px-3 py-2 text-sm text-loss" role="alert">
                {serverError}
              </p>
            )}

            <Button type="submit" loading={loading} className="mt-2 w-full">
              Entrar
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-content-muted">
            Não tem conta?{' '}
            <Link href="/register" className="font-medium text-primary hover:underline">
              Cadastre-se
            </Link>
          </p>
        </Card>
      </motion.div>
    </div>
  );
}
