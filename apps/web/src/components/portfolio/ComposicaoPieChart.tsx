'use client';

import { PieChart, Pie, Cell, Tooltip } from 'recharts';

interface PieDataItem {
  name: string;
  value: number;
  color: string;
}

interface Props {
  data: PieDataItem[];
}

export function ComposicaoPieChart({ data }: Props) {
  return (
    <PieChart width={240} height={200}>
      <Pie
        data={data}
        cx={110}
        cy={90}
        innerRadius={55}
        outerRadius={90}
        paddingAngle={2}
        dataKey="value"
      >
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={entry.color} />
        ))}
      </Pie>
      <Tooltip
        formatter={(value: number) => [
          `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          '',
        ]}
        contentStyle={{ fontSize: 12, borderRadius: 8 }}
      />
    </PieChart>
  );
}
