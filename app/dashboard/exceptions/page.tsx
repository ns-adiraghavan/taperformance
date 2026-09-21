'use client';
import { useState } from 'react';
import { useActiveSnapshot, useAppStore } from '@/lib/store';
import { formatDate } from '@/lib/businessDays';
import { StatusBadge, EmptyState } from '@/components/ui';
import { Upload, AlertTriangle, Clock, Pause, XCircle, MessageSquare, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { ReqComment } from '@/lib/types';

export default function ExceptionsPage() {
  const router = useRouter();
  const snap = useActiveSnapshot();
  const { settings, addComment, getComments } = useAppStore();

  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [expandedReq, setExpandedReq] = useState<string | null>(null);

  if (!snap) {
    return (
      <EmptyState
        icon={<Upload size={36} />}
        title="No data yet"
        message="Upload a snapshot to see exceptions."
        action={<button className="btn btn-primary" onClick={() => router.push('/dashboard/upload')}><Upload size={14} /> Upload snapshot</button>}
      />
    );
  }

  const reqs = snap.requisitions;
  const activeReqs = reqs.filter(r => ['Open','In Progress'].includes(r.status));

  const breached = activeReqs.filter(r => r.isBreached).sort((a, b) => (a.varianceDays ?? 0) - (b.varianceDays ?? 0));
  const atRisk   = activeReqs.filter(r => r.ageingStatus === 'amber').sort((a, b) => (a.varianceDays ?? 0) - (b.varianceDays ?? 0));
  const stalled  = activeReqs.filter(r => {
    if (!r.raisedDate) return false;
    const daysSinceRaised = Math.floor((Date.now() - new Date(r.raisedDate).getTime()) / 86400000);
    return daysSinceRaised >= settings.stalledDays && (r.sourcingCnt ?? 0) === 0;
  });
  const paused   = reqs.filter(r => r.isPaused);
  const noTA     = reqs.filter(r => r.taMembers.length === 0 && ['Open','In Progress'].includes(r.status));

  function submitComment(reqId: string) {
    const text = (commentInputs[reqId] || '').trim();
    if (!text) return;
    const session = getSession();
    const comment: ReqComment = {
      id: `cmt_${Date.now()}`,
      requisitionId: reqId,
      authorName: session?.name ?? 'Anonymous',
      text,
      createdAt: new Date().toISOString(),
      isHrRequest: false,
    };
    addComment(comment);
    setCommentInputs(prev => ({ ...prev, [reqId]: '' }));
  }

  function Section({
    title,
    badge,
    icon,
    items,
    emptyMsg,
    bgColor,
    borderColor,
    textColor,
  }: {
    title: string;
    badge?: number;
    icon: React.ReactNode;
    items: typeof breached;
    emptyMsg: string;
    bgColor: string;
    borderColor: string;
    textColor: string;
  }) {
    return (
      <div style={{ border: `1px solid ${borderColor}`, borderRadius: 10, overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ background: bgColor, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: textColor }}>{icon}</span>
          <span style={{ fontWeight: 700, fontSize: 14, color: textColor }}>{title}</span>
          {badge !== undefined && (
            <span style={{ background: textColor, color: '#fff', borderRadius: 99, fontSize: 11, fontWeight: 700, padding: '2px 8px' }}>
              {badge}
            </span>
          )}
        </div>
        {items.length === 0 ? (
          <div style={{ padding: '20px 18px', fontSize: 13, color: '#94A3B8' }}>{emptyMsg}</div>
        ) : (
          <div>
            {items.map(r => {
              const comments = getComments(r.id);
              const isExpanded = expandedReq === r.id;
              return (
                <div key={r.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <div
                    style={{ padding: '12px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
                    onClick={() => setExpandedReq(isExpanded ? null : r.id)}
                  >
                    <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#0F4C81', minWidth: 80 }}>{r.id}</span>
                    <span style={{ fontSize: 13, flex: 1 }}>{r.designation} — {r.division}</span>
                    <span style={{ fontSize: 12, color: '#64748B' }}>{r.taMembers.join(', ') || 'Unassigned'}</span>
                    <span style={{ fontSize: 12, color: '#64748B' }}>Age: {r.ageingDays ?? '—'}d</span>
                    {r.ageingStatus === 'red' && <span style={{ fontSize: 12, color: '#DC2626', fontWeight: 700 }}>+{Math.abs(r.varianceDays ?? 0)}d over</span>}
                    {r.ageingStatus === 'amber' && <span style={{ fontSize: 12, color: '#D97706', fontWeight: 600 }}>{r.varianceDays ?? '—'}d left</span>}
                    {comments.length > 0 && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#64748B' }}>
                        <MessageSquare size={12} /> {comments.length}
                      </span>
                    )}
                  </div>
                  {isExpanded && (
                    <div style={{ padding: '12px 18px 16px 18px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
                      {/* Comments */}
                      {comments.length > 0 && (
                        <div style={{ marginBottom: 12 }}>
                          {comments.map(c => (
                            <div key={c.id} style={{ marginBottom: 8 }}>
                              <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{c.authorName}</span>
                              <span style={{ fontSize: 11, color: '#94A3B8', marginLeft: 6 }}>{new Date(c.createdAt).toLocaleString('en-IN')}</span>
                              <div style={{ fontSize: 13, color: '#0F172A', marginTop: 3 }}>{c.text}</div>
                            </div>
                          ))}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          className="input"
                          placeholder="Add a note or action taken…"
                          value={commentInputs[r.id] ?? ''}
                          onChange={e => setCommentInputs(prev => ({ ...prev, [r.id]: e.target.value }))}
                          onKeyDown={e => { if (e.key === 'Enter') submitComment(r.id); }}
                          style={{ flex: 1 }}
                        />
                        <button className="btn btn-primary" style={{ height: 36 }} onClick={() => submitComment(r.id)}>
                          <Send size={12} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', margin: 0 }}>Exceptions</h1>
        <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>Auto-detected issues requiring attention · click any row to add notes</p>
      </div>

      <Section
        title="Breached TAT"
        badge={breached.length}
        icon={<XCircle size={16} />}
        items={breached}
        emptyMsg="✓ No breached requisitions"
        bgColor="#FEF2F2"
        borderColor="#FECACA"
        textColor="#DC2626"
      />

      <Section
        title="At Risk (Approaching Deadline)"
        badge={atRisk.length}
        icon={<AlertTriangle size={16} />}
        items={atRisk}
        emptyMsg="✓ No at-risk requisitions"
        bgColor="#FFFBEB"
        borderColor="#FDE68A"
        textColor="#D97706"
      />

      <Section
        title="No TA Assigned"
        badge={noTA.length}
        icon={<AlertTriangle size={16} />}
        items={noTA}
        emptyMsg="✓ All active requisitions have TA assignments"
        bgColor="#FFF7ED"
        borderColor="#FDBA74"
        textColor="#EA580C"
      />

      <Section
        title={`Stalled (no sourcing after ${settings.stalledDays} days)`}
        badge={stalled.length}
        icon={<Clock size={16} />}
        items={stalled}
        emptyMsg="✓ No stalled requisitions"
        bgColor="#F8FAFC"
        borderColor="#E2E8F0"
        textColor="#475569"
      />

      {paused.length > 0 && (
        <Section
          title="Paused Requisitions"
          badge={paused.length}
          icon={<Pause size={16} />}
          items={paused}
          emptyMsg="No paused requisitions"
          bgColor="#EFF6FF"
          borderColor="#BFDBFE"
          textColor="#2563EB"
        />
      )}
    </div>
  );
}
