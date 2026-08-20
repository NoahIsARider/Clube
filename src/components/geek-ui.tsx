'use client';

import { cn } from '@/lib/utils';

interface FrameProps {
  children: React.ReactNode;
  className?: string;
  label?: string;
  meta?: string;
}

/**
 * 「框」组件 — 极简 1px 边框卡片，头部可选 label + meta（等宽小字）。
 */
export function Frame({ children, className, label, meta }: FrameProps) {
  return (
    <div className={cn('border hair-line bg-[color:var(--background)]', className)}>
      {(label || meta) && (
        <div className="flex items-center justify-between border-b hair-line px-4 py-2">
          {label && (
            <span className="mono text-[10px] text-[color:var(--muted-foreground)]">
              {label}
            </span>
          )}
          {meta && (
            <span className="mono text-[10px] text-[color:var(--muted-foreground)]">
              {meta}
            </span>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

interface StatusDotProps {
  status: 'draft' | 'published' | 'ongoing' | 'finished' | 'canceled' | string;
  className?: string;
}

const STATUS_MAP: Record<string, { color: string; label: string }> = {
  draft: { color: 'bg-[color:var(--grain)]', label: 'DRAFT' },
  published: { color: 'bg-[color:var(--amber)]', label: 'OPEN' },
  ongoing: { color: 'bg-[color:var(--phosphor)]', label: 'LIVE' },
  finished: { color: 'bg-[color:var(--muted-foreground)]', label: 'DONE' },
  canceled: { color: 'bg-[color:var(--destructive)]', label: 'CXL' },
};

export function StatusDot({ status, className }: StatusDotProps) {
  const conf = STATUS_MAP[status] ?? { color: 'bg-[color:var(--grain)]', label: status.toUpperCase() };
  return (
    <span className={cn('inline-flex items-center gap-1.5 mono text-[10px]', className)}>
      <span className={cn('w-1.5 h-1.5 inline-block', conf.color, status === 'ongoing' && 'dot-pulse')} />
      {conf.label}
    </span>
  );
}

interface CrosshairFrameProps {
  children?: React.ReactNode;
  className?: string;
  aspect?: string;
}

/** 十字准星框，用于空海报占位 / 空状态。 */
export function CrosshairFrame({ children, className, aspect = 'aspect-[2/3]' }: CrosshairFrameProps) {
  return (
    <div
      className={cn(
        'relative border hair-line flex items-center justify-center overflow-hidden bg-[color:var(--muted)]/30',
        aspect,
        className
      )}
    >
      <span className="absolute top-1 left-1 mono text-[10px] text-[color:var(--muted-foreground)]/60">+</span>
      <span className="absolute top-1 right-1 mono text-[10px] text-[color:var(--muted-foreground)]/60">+</span>
      <span className="absolute bottom-1 left-1 mono text-[10px] text-[color:var(--muted-foreground)]/60">+</span>
      <span className="absolute bottom-1 right-1 mono text-[10px] text-[color:var(--muted-foreground)]/60">+</span>
      {children}
    </div>
  );
}
