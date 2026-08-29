import { WeightEntry } from "@/lib/types";

interface WeightChartProps {
  entries: WeightEntry[];
  targetWeightKg?: number;
}

const WIDTH = 640;
const HEIGHT = 220;
const PAD_X = 36;
const PAD_Y = 24;

export default function WeightChart({ entries, targetWeightKg }: WeightChartProps) {
  if (entries.length === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center text-sm text-neutral-400">
        아직 기록된 체중이 없습니다.
      </div>
    );
  }

  const weights = entries.map((e) => e.weightKg);
  const allValues = targetWeightKg ? [...weights, targetWeightKg] : weights;
  const rawMin = Math.min(...allValues);
  const rawMax = Math.max(...allValues);
  const span = Math.max(rawMax - rawMin, 1);
  const min = rawMin - span * 0.15;
  const max = rawMax + span * 0.15;

  const innerW = WIDTH - PAD_X * 2;
  const innerH = HEIGHT - PAD_Y * 2;

  const x = (i: number) =>
    entries.length === 1
      ? PAD_X + innerW / 2
      : PAD_X + (i / (entries.length - 1)) * innerW;
  const y = (w: number) => PAD_Y + innerH - ((w - min) / (max - min)) * innerH;

  const linePoints = entries.map((e, i) => `${x(i)},${y(e.weightKg)}`).join(" ");
  const areaPoints = `${PAD_X},${PAD_Y + innerH} ${linePoints} ${x(entries.length - 1)},${PAD_Y + innerH}`;

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="min-w-[480px]"
        role="img"
        aria-label="체중 변화 그래프"
      >
        {targetWeightKg !== undefined && (
          <>
            <line
              x1={PAD_X}
              x2={WIDTH - PAD_X}
              y1={y(targetWeightKg)}
              y2={y(targetWeightKg)}
              stroke="#f59e0b"
              strokeDasharray="4 4"
              strokeWidth={1.5}
            />
            <text x={WIDTH - PAD_X} y={y(targetWeightKg) - 6} textAnchor="end" className="fill-amber-500 text-[10px]">
              목표 {targetWeightKg}kg
            </text>
          </>
        )}

        <polygon points={areaPoints} fill="#10b981" opacity={0.08} />
        <polyline points={linePoints} fill="none" stroke="#10b981" strokeWidth={2.5} />

        {entries.map((e, i) => (
          <g key={e.id}>
            <circle cx={x(i)} cy={y(e.weightKg)} r={3.5} className="fill-emerald-500" />
            {(i === 0 || i === entries.length - 1 || entries.length <= 8) && (
              <text
                x={x(i)}
                y={y(e.weightKg) - 10}
                textAnchor="middle"
                className="fill-neutral-600 text-[10px] font-medium"
              >
                {e.weightKg}
              </text>
            )}
            <text
              x={x(i)}
              y={HEIGHT - 4}
              textAnchor="middle"
              className="fill-neutral-400 text-[9px]"
            >
              {e.date.slice(5)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
