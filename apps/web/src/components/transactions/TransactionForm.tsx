'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { queryKeys } from '@/lib/query-keys';
import { createTransaction } from '@/lib/api/transactions';
import { ApiClientError } from '@/lib/api/client';

const schema = z.object({
  type: z.enum(['BUY', 'SELL'], {
    errorMap: () => ({ message: 'Selecione o tipo' }),
  }),
  date: z.string().min(1, 'Data obrigatória'),
  quantity: z
    .string()
    .min(1, 'Quantidade obrigatória')
    .refine((v) => parseFloat(v) > 0, 'Quantidade deve ser maior que zero'),
  unit_price: z
    .string()
    .min(1, 'Preço obrigatório')
    .refine((v) => parseFloat(v) > 0, 'Preço deve ser maior que zero'),
  fees: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const TYPE_OPTIONS = [
  { value: 'BUY', label: 'Compra (BUY)' },
  { value: 'SELL', label: 'Venda (SELL)' },
];

const shakeVariants = {
  idle: { x: 0 },
  shake: {
    x: [0, -10, 10, -10, 10, -6, 6, 0],
    transition: { duration: 0.5 },
  },
};

interface TransactionFormProps {
  assetId: string;
}

export function TransactionForm({ assetId }: TransactionFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const [shaking, setShaking] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'BUY',
      date: new Date().toISOString().split('T')[0],
    },
  });

  const triggerShake = () => {
    setShaking(true);
    setTimeout(() => setShaking(false), 600);
  };

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      await createTransaction(assetId, {
        type: values.type,
        date: values.date,
        quantity: values.quantity,
        unit_price: values.unit_price,
        fees: values.fees || undefined,
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.transactions.byAsset(assetId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.portfolio.summary() });
      router.push(`/assets/${assetId}`);
    } catch (err) {
      let msg = 'Erro ao registrar transação';
      if (err instanceof ApiClientError) {
        const body = err.body as { message?: string | string[] };
        if (Array.isArray(body?.message)) {
          msg = body.message.join(', ');
        } else if (typeof body?.message === 'string') {
          msg = body.message;
        }
        // 422 = violação de regra de negócio (SELL > posição)
        if (err.status === 422) {
          msg = `Venda inválida: ${msg}`;
        }
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setServerError(msg);
      triggerShake();
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-4 max-w-lg"
      variants={shakeVariants}
      animate={shaking ? 'shake' : 'idle'}
    >
      <Select
        label="Tipo"
        options={TYPE_OPTIONS}
        {...register('type')}
        error={errors.type?.message}
      />
      <Input
        label="Data"
        type="date"
        {...register('date')}
        error={errors.date?.message}
      />
      <Input
        label="Quantidade"
        type="number"
        step="any"
        min="0"
        placeholder="Ex: 10"
        {...register('quantity')}
        error={errors.quantity?.message}
      />
      <Input
        label="Preço unitário"
        type="number"
        step="any"
        min="0"
        placeholder="Ex: 25.50"
        {...register('unit_price')}
        error={errors.unit_price?.message}
      />
      <Input
        label="Taxas (opcional)"
        type="number"
        step="any"
        min="0"
        placeholder="Ex: 0.50"
        {...register('fees')}
        error={errors.fees?.message}
      />

      {serverError && (
        <p
          className="rounded-lg bg-loss-surface px-3 py-2 text-sm text-loss"
          role="alert"
          data-testid="transaction-error"
        >
          {serverError}
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="submit" loading={isSubmitting}>
          Registrar Transação
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </motion.form>
  );
}
