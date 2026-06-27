'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth/context';

const schema = z.object({
  name: z.string().optional(),
  email: z.string().email('E-mail inválido'),
  password: z
    .string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'As senhas não conferem',
  path: ['confirmPassword'],
});

type FormValues = z.infer<typeof schema>;

const shakeVariants = {
  idle: { x: 0 },
  shake: {
    x: [0, -10, 10, -10, 10, -6, 6, 0],
    transition: { duration: 0.5 },
  },
};

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
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
      await registerUser(values.email, values.password);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao criar conta';
      setServerError(msg);
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4">
        <motion.div
          className="w-full"
          variants={shakeVariants}
          animate={shaking ? 'shake' : 'idle'}
        >
          <div className="glass-panel rounded-xl p-8 w-full max-w-md mx-auto my-8">
            <Link href="/" className="text-headline-md font-bold text-primary text-center block">
              databolsa
            </Link>

            <h1 className="text-2xl font-semibold text-on-surface text-center mt-6">
              Criar Conta
            </h1>
            <p className="text-body-sm text-on-surface-variant text-center mb-6">
              Crie sua conta para começar
            </p>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-body-sm text-on-surface">Nome</label>
                <input
                  type="text"
                  autoComplete="name"
                  placeholder="Seu nome (opcional)"
                  className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary w-full"
                  {...register('name')}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-body-sm text-on-surface">E-mail</label>
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="seu@email.com"
                  className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary w-full"
                  {...register('email')}
                />
                {errors.email?.message && (
                  <p className="text-xs text-error">{errors.email.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-body-sm text-on-surface">Senha</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="Mínimo 8 caracteres"
                  className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary w-full"
                  {...register('password')}
                />
                {errors.password?.message && (
                  <p className="text-xs text-error">{errors.password.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-body-sm text-on-surface">Confirmar senha</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="Repita a senha"
                  className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary w-full"
                  {...register('confirmPassword')}
                />
                {errors.confirmPassword?.message && (
                  <p className="text-xs text-error">{errors.confirmPassword.message}</p>
                )}
              </div>

              {serverError && (
                <p className="text-xs text-error bg-error/10 rounded-lg px-3 py-2" role="alert">
                  {serverError}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-on-primary font-medium py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {loading ? 'Criando…' : 'Criar conta'}
              </button>
            </form>

            <p className="text-body-sm text-on-surface-variant text-center mt-6">
              Já tem uma conta?{' '}
              <Link href="/login" className="text-primary font-medium hover:underline">
                Entrar
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
