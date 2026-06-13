'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { queryKeys } from '@/lib/query-keys';
import { createAsset } from '@/lib/api/assets';

const ASSET_CLASS_OPTIONS = [
  { value: 'STOCK_BR', label: 'Ação Brasileira (STOCK_BR)' },
  { value: 'FII', label: 'Fundo Imobiliário (FII)' },
  { value: 'ETF', label: 'ETF' },
  { value: 'BDR', label: 'BDR' },
  { value: 'CRYPTO', label: 'Criptomoeda (CRYPTO)' },
  { value: 'STOCK_US', label: 'Ação Internacional (STOCK_US)' },
];

const CURRENCY_OPTIONS = [
  { value: 'BRL', label: 'BRL — Real Brasileiro' },
  { value: 'USD', label: 'USD — Dólar Americano' },
];

const DATA_SOURCE_OPTIONS = [
  { value: 'BRAPI', label: 'BRAPI (ativos B3)' },
  { value: 'COINGECKO', label: 'CoinGecko (crypto)' },
  { value: 'FINNHUB', label: 'Finnhub (ativos US)' },
];

const schema = z.object({
  ticker: z.string().min(1, 'Ticker obrigatório').toUpperCase(),
  name: z.string().min(1, 'Nome obrigatório'),
  asset_class: z.enum(['STOCK_BR', 'FII', 'ETF', 'BDR', 'CRYPTO', 'STOCK_US'], {
    errorMap: () => ({ message: 'Selecione uma categoria' }),
  }),
  currency: z.enum(['BRL', 'USD'], {
    errorMap: () => ({ message: 'Selecione uma moeda' }),
  }),
  data_source: z.enum(['BRAPI', 'COINGECKO', 'FINNHUB'], {
    errorMap: () => ({ message: 'Selecione a fonte de dados' }),
  }),
});

type FormValues = z.infer<typeof schema>;

export function AssetForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      const asset = await createAsset(values);
      await queryClient.invalidateQueries({ queryKey: queryKeys.assets.list() });
      router.push(`/assets/${asset.id}`);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Erro ao criar ativo');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4 max-w-lg">
      <Input
        label="Ticker"
        placeholder="Ex: PETR4, BTCUSDT"
        {...register('ticker')}
        error={errors.ticker?.message}
      />
      <Input
        label="Nome"
        placeholder="Ex: Petrobras PN"
        {...register('name')}
        error={errors.name?.message}
      />
      <Select
        label="Categoria"
        placeholder="Selecione..."
        options={ASSET_CLASS_OPTIONS}
        {...register('asset_class')}
        error={errors.asset_class?.message}
      />
      <Select
        label="Moeda"
        placeholder="Selecione..."
        options={CURRENCY_OPTIONS}
        {...register('currency')}
        error={errors.currency?.message}
      />
      <Select
        label="Fonte de cotação"
        placeholder="Selecione..."
        options={DATA_SOURCE_OPTIONS}
        {...register('data_source')}
        error={errors.data_source?.message}
      />

      {serverError && (
        <p className="rounded-lg bg-loss-surface px-3 py-2 text-sm text-loss" role="alert">
          {serverError}
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="submit" loading={isSubmitting}>
          Criar Ativo
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
