'use client';
import { AgeingStatus } from '@/lib/types';

// ─── Status badge ──────────────────────────────────────────────────────────
const STATUS_STYLE: Record<string, string> = {
  'Open':               'badge badge-blue',
  'In Progress':        'badge badge-purple',
  'Closed-Filled':      'badge badge-green',
  'Cancelled':          'badge badge-gray',
  'Rejected@Approval':  'badge badge-red',
  'Draft/Unapproved':   'badge badge-gray',
  'Unknown':            'badge badge-gray',
};

export function StatusBadge({ status }: { status: string }) {
  return <span className={STATUS_STYLE[status] ?? 'badge badge-gray'}>{status}</span>;
}

// ─── Variance chip ─────────────────────────────────────────────────────────
export function VarianceBadge({
  days, variance, status, ageingStatus,
}: {
  days?: number | null;
  variance?: number | null;
  status?: AgeingStatus;
  ageingStatus?: AgeingStatus;
}) {
  const d = days ?? variance ?? null;
  const s = status ?? ageingStatus ?? 'na';
  if (d === null || s === 'na') return <span style={{ color:'#94A3B8' }}>—</span>;
  const cls =
    s === 'green' ? 'badge badge-green' :
    s === 'amber' ? 'badge badge-amber' :
    'badge badge-red';
  const sign = d >= 0 ? '+' : '';
  return <span className={cls}>{sign}{d}d</span>;
}

// ─── Inferred TAT badge ────────────────────────────────────────────────────
export function InferredBadge() {
  return (
    <span style={{
      display:'inline-block', fontSize:10, fontWeight:600, padding:'1px 6px',
      borderRadius:3, background:'#FEF9C3', color:'#854D0E', border:'1px solid #FEF08A',
    }}>
      inferred
    </span>
  );
}

// ─── Paused badge ─────────────────────────────────────────────────────────
export function PausedBadge() {
  return (
    <span style={{
      display:'inline-block', fontSize:10, fontWeight:600, padding:'1px 6px',
      borderRadius:3, background:'#F0F9FF', color:'#0369A1', border:'1px solid #BAE6FD',
    }}>
      paused
    </span>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────
export function EmptyState({ icon, title, message, action }: {
  icon?: React.ReactNode;
  title: string;
  message?: string;
  action?: React.ReactNode;
}) {
  return (
    <div style={{ textAlign:'center', padding:'64px 32px', color:'#94A3B8' }}>
      {icon && <div style={{ marginBottom:16, opacity:0.4 }}>{icon}</div>}
      <div style={{ fontSize:16, fontWeight:600, color:'#475569', marginBottom:8 }}>{title}</div>
      {message && <div style={{ fontSize:13, maxWidth:400, margin:'0 auto 20px' }}>{message}</div>}
      {action}
    </div>
  );
}

// ─── Card ──────────────────────────────────────────────────────────────────
export function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background:'white', border:'1px solid #E2E8F0',
      borderRadius:8, boxShadow:'0 1px 3px rgba(0,0,0,0.06)',
      ...style,
    }}>
      {children}
    </div>
  );
}

// ─── Section header inside a card ─────────────────────────────────────────
export function CardHeader({ title, sub, subtitle, actions }: {
  title: string; sub?: string; subtitle?: string; actions?: React.ReactNode;
}) {
  const subText = sub ?? subtitle;
  return (
    <div style={{
      padding:'16px 20px', borderBottom:'1px solid #F1F5F9',
      display:'flex', alignItems:'center', justifyContent:'space-between', gap:12,
    }}>
      <div>
        <div className="section-title">{title}</div>
        {subText && <div className="section-sub">{subText}</div>}
      </div>
      {actions && <div style={{ display:'flex', gap:8, alignItems:'center' }}>{actions}</div>}
    </div>
  );
}

// ─── Filter row ────────────────────────────────────────────────────────────
export function FilterBar({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display:'flex', gap:10, flexWrap:'wrap', alignItems:'center',
      padding:'12px 20px', borderBottom:'1px solid #F1F5F9', background:'#FAFAFA',
    }}>
      {children}
    </div>
  );
}

// ─── Divider ───────────────────────────────────────────────────────────────
export function Divider() {
  return <div style={{ height:1, background:'#F1F5F9', margin:'16px 0' }} />;
}

// ─── Spinner ───────────────────────────────────────────────────────────────
export function Spinner() {
  return (
    <div style={{
      width:20, height:20, border:'2px solid #E2E8F0',
      borderTop:'2px solid #0F4C81', borderRadius:'50%',
      animation:'spin 0.8s linear infinite',
    }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
