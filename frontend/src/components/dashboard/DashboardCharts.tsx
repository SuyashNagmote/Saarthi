'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  ZAxis,
} from 'recharts';

const COLORS = ['#16a34a', '#1a56db', '#ca8a04', '#dc2626', '#a3a3a3'];

interface GoalProgressDatum {
  title: string;
  target: number;
  actual: number;
}

interface TrendDatum {
  quarter: string;
  score: number;
}

interface CompletionDatum {
  id: string;
  name: string;
  goals: number;
  checkins: number;
  completionPct?: number;
}

interface AttritionDatum {
  id: string;
  name: string;
  department: string;
  designation: string;
  performanceScore: number;
  riskScore: number;
  riskLevel: string;
  riskReason: string;
}

export function GoalProgressChart({ data }: { data: GoalProgressDatum[] }) {
  if (!data || data.length === 0) return <div className="text-center text-[13px] text-[var(--color-text-3)] py-10">No data available</div>;

  // Normalize all values to % of target so mixed-scale goals (e.g. 1.2M revenue vs 90% reliability)
  // render on the same 0–100 axis instead of making small goals invisible.
  const normalized = data.map((d) => ({
    title: d.title,
    target: 100,
    actual: d.target > 0 ? Math.min(Math.round((d.actual / d.target) * 100), 150) : 0,
  }));

  return (
    <div className="rounded-lg bg-[var(--color-surface-2)] p-2">
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={normalized} margin={{ top: 20, right: 30, left: 0, bottom: 40 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
        <XAxis
          dataKey="title"
          tick={{ fontSize: 11, fill: 'var(--color-text-2)' }}
          axisLine={false}
          tickLine={false}
          angle={-30}
          textAnchor="end"
          interval={0}
          tickFormatter={(val) => val.length > 18 ? val.substring(0, 18) + '…' : val}
        />
        <YAxis
          tick={{ fontSize: 12, fill: 'var(--color-text-2)' }}
          axisLine={false}
          tickLine={false}
          domain={[0, 120]}
          tickFormatter={(v) => `${v}%`}
          label={{ value: '% of target', angle: -90, position: 'insideLeft', fill: 'var(--color-text-3)', fontSize: 11, offset: 10 }}
        />
        <Tooltip
          contentStyle={{ backgroundColor: 'var(--color-surface)', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '13px' }}
          cursor={{ fill: 'var(--color-surface-2)' }}
          formatter={(value, name) => [
            `${Number(value)}%`,
            String(name) === 'actual' ? 'Achieved' : 'Target',
          ]}
        />
        <Bar dataKey="target" name="Target" fill="var(--color-border-2)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="actual" name="Actual" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
    </div>
  );
}

export function TrendChart({ data }: { data: TrendDatum[] }) {
  if (!data || data.length === 0) return <div className="text-center text-[13px] text-[var(--color-text-3)] py-10">No data available</div>;

  return (
    <div className="rounded-lg bg-[var(--color-surface-2)] p-2">
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
        <XAxis dataKey="quarter" tick={{ fontSize: 12, fill: 'var(--color-text-2)' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: 'var(--color-text-2)' }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
        <Tooltip
          contentStyle={{ backgroundColor: 'var(--color-surface)', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '13px' }}
        />
        <Line type="monotone" dataKey="score" stroke="var(--color-accent)" strokeWidth={3} dot={{ r: 4, fill: 'var(--color-accent)' }} activeDot={{ r: 6 }} />
      </LineChart>
    </ResponsiveContainer>
    </div>
  );
}

export function DistributionDonut({ data }: { data: { name: string; value: number }[] }) {
  if (!data || data.length === 0 || data.every(d => d.value === 0)) {
    return <div className="text-center text-[13px] text-[var(--color-text-3)] py-10">No data available</div>;
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            innerRadius={55}
            outerRadius={75}
            paddingAngle={5}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: 'var(--color-surface)', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '13px' }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 justify-center">
        {data.map((entry, index) => (
          <div key={entry.name} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: COLORS[index % COLORS.length] }} />
            <span className="text-[12px] text-[var(--color-text-2)]">{entry.name}</span>
            <span className="text-[12px] font-semibold text-[var(--color-text-1)]">
              {total > 0 ? Math.round((entry.value / total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CompletionHeatmap({ data }: { data: CompletionDatum[] }) {
  if (!data || data.length === 0) return <div className="text-center text-[13px] text-[var(--color-text-3)] py-10">No data available</div>;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {data.map((emp) => {
        const pct =
          emp.completionPct ??
          (emp.goals > 0 ? Math.min(100, Math.round((emp.checkins / emp.goals) * 100)) : 0);
        let color = 'var(--color-danger)';
        let bg = 'var(--color-danger-bg)';
        if (pct >= 80) { color = 'var(--color-success)'; bg = 'var(--color-success-bg)'; }
        else if (pct >= 50) { color = 'var(--color-warning)'; bg = 'var(--color-warning-bg)'; }

        return (
          <div key={emp.id} className="rounded-lg p-3 border border-[var(--color-border)]" style={{ backgroundColor: bg }}>
            <p className="text-[13px] font-medium truncate mb-2">{emp.name}</p>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[11px] text-[var(--color-text-2)] uppercase tracking-wide">Completion</p>
                <p className="text-[18px] font-bold" style={{ color }}>{Math.round(pct)}%</p>
              </div>
              <p className="text-[12px] text-[var(--color-text-2)]">{emp.checkins}/{emp.goals} goals</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function AttritionScatterChart({ data }: { data: AttritionDatum[] }) {
  if (!data || data.length === 0) return <div className="text-center text-[13px] text-[var(--color-text-3)] py-10">No data available</div>;

  // Custom Tooltip
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: AttritionDatum }[] }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-3 shadow-md max-w-[250px]">
          <p className="font-semibold text-[14px] mb-1">{data.name}</p>
          <p className="text-[12px] text-[var(--color-text-2)] mb-2">{data.department} • {data.designation}</p>
          <div className="flex justify-between items-center text-[13px] mb-1">
            <span>Performance:</span>
            <span className="font-medium">{data.performanceScore}/100</span>
          </div>
          <div className="flex justify-between items-center text-[13px] mb-2">
            <span>Risk Level:</span>
            <span className="font-medium" style={{ 
              color: data.riskLevel === 'CRITICAL' ? 'var(--color-danger)' : 
                     data.riskLevel === 'HIGH' ? 'var(--color-warning)' : 
                     data.riskLevel === 'MEDIUM' ? '#CA8A04' : 'var(--color-success)' 
            }}>{data.riskLevel}</span>
          </div>
          <div className="text-[12px] bg-[var(--color-surface-2)] p-2 rounded text-[var(--color-text-2)]">
            <span className="font-medium text-[var(--color-text-1)]">Why:</span> {data.riskReason}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-lg bg-[var(--color-surface-2)] p-2">
    <ResponsiveContainer width="100%" height={350}>
      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis 
          type="number" 
          dataKey="performanceScore" 
          name="Performance" 
          domain={[0, 100]} 
          tick={{ fontSize: 12, fill: 'var(--color-text-2)' }} 
          axisLine={{ stroke: 'var(--color-border)' }} 
          tickLine={false} 
          label={{ value: 'Performance Score (0-100)', position: 'insideBottom', offset: -15, fill: 'var(--color-text-2)', fontSize: 12 }}
        />
        <YAxis 
          type="number" 
          dataKey="riskScore" 
          name="Risk" 
          domain={[0, 100]} 
          tick={{ fontSize: 12, fill: 'var(--color-text-2)' }} 
          axisLine={{ stroke: 'var(--color-border)' }} 
          tickLine={false}
          label={{ value: 'Attrition Risk', angle: -90, position: 'insideLeft', fill: 'var(--color-text-2)', fontSize: 12 }}
        />
        <ZAxis type="number" range={[100, 100]} />
        <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
        <Scatter data={data} shape={(props: unknown) => {
          const { cx, cy, payload } = props as { cx: number; cy: number; payload: AttritionDatum };
          let fill = 'var(--color-success)'; // LOW
          if (payload.riskLevel === 'CRITICAL') fill = 'var(--color-danger)';
          else if (payload.riskLevel === 'HIGH') fill = 'var(--color-warning)';
          else if (payload.riskLevel === 'MEDIUM') fill = '#eab308'; // yellow-500
          
          return (
            <circle cx={cx} cy={cy} r={payload.riskLevel === 'CRITICAL' ? 8 : 6} fill={fill} fillOpacity={0.8} stroke="white" strokeWidth={1.5} />
          );
        }} />
      </ScatterChart>
    </ResponsiveContainer>
    </div>
  );
}
