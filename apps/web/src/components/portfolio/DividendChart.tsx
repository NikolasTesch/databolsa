'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatBRL } from '@/lib/format';
import type { DividendsResponse } from '@/types/api';

interface Props {
  data: DividendsResponse;
}

export function DividendChart({ data }: Props) {
  const byMonth = data.by_month.map(m => ({
    label: m.key,
    value: parseFloat(m.value_brl),
  }));

  if (byMonth.length === 0) {
    return <p className="text-sm text-on-surface-variant py-4">Nenhum dividendo registrado.</p>;
  }

  return (
    <div>
      <h3 className="mb-3 text-sm font-medium">Dividendos Mensais</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={byMonth} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} />
          <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={60} />
          <Tooltip formatter={(v: number) => [formatBRL(String(v)), 'Dividendos']} />
          <Bar dataKey="value" fill="#16a34a" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      {/* Quarterly breakdown */}
      {data.by_quarter.length > 0 && (
        <>
          <h3 className="mt-6 mb-3 text-sm font-medium">Dividendos por Trimestre</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data.by_quarter.map(q => ({ label: q.key, value: parseFloat(q.value_brl) }))} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={60} />
              <Tooltip formatter={(v: number) => [formatBRL(String(v)), 'Dividendos']} />
              <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  );
}
