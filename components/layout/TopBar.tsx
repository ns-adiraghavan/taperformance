'use client';
import { useAppStore, useActiveSnapshot } from '@/lib/store';
import { formatDate } from '@/lib/businessDays';
import { Upload, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { useState } from 'react';

interface Props {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function TopBar({ title, subtitle, actions }: Props) {
  const { snapshots, activeSnapshotId, setActiveSnapshot } = useAppStore();
  const active = useActiveSnapshot();
  const router = useRouter();
  const session = getSession();
  const [open, setOpen] = useState(false);

  return (
    <header style={{
      background:'white',
      borderBottom:'1px solid #E2E8F0',
      padding:'0 28px',
      height:60,
      display:'flex',
      alignItems:'center',
      justifyContent:'space-between',
      gap:20,
      flexShrink:0,
    }}>
      {/* Left: title / snapshot label */}
      <div>
        {title
          ? <h1 style={{ fontSize:16, fontWeight:700, color:'#0F172A', lineHeight:1.2 }}>{title}</h1>
          : <span style={{ fontSize:14, fontWeight:600, color:'#0F172A' }}>TA Performance Dashboard</span>
        }
        {subtitle && <p style={{ fontSize:12, color:'#94A3B8', lineHeight:1.3 }}>{subtitle}</p>}
      </div>

      {/* Right: snapshot picker + upload + user */}
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>

        {/* Snapshot selector */}
        {snapshots.length > 0 && (
          <div style={{ position:'relative' }}>
            <button
              onClick={() => setOpen(!open)}
              className="btn btn-secondary"
              style={{ fontSize:12, height:34, paddingRight:10 }}
            >
              <span style={{ color:'#64748B' }}>As of:</span>&nbsp;
              <span style={{ fontWeight:600 }}>
                {active ? formatDate(new Date(active.asOfDate)) : 'Select'}
              </span>
              <ChevronDown size={13} style={{ marginLeft:4 }} />
            </button>

            {open && (
              <div style={{
                position:'absolute', right:0, top:'calc(100% + 6px)', zIndex:50,
                background:'white', border:'1px solid #E2E8F0',
                borderRadius:8, boxShadow:'0 8px 24px rgba(0,0,0,0.1)',
                minWidth:240, maxHeight:260, overflowY:'auto',
              }}
              onMouseLeave={() => setOpen(false)}
              >
                {snapshots.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => { setActiveSnapshot(s.id); setOpen(false); }}
                    style={{
                      display:'block', width:'100%', padding:'10px 16px',
                      textAlign:'left', border:'none',
                      cursor:'pointer', fontSize:13,
                      background: s.id === (activeSnapshotId ?? snapshots[snapshots.length-1]?.id)
                        ? '#EFF6FF' : 'transparent',
                    }}
                  >
                    <div style={{ fontWeight:600, color:'#0F172A' }}>{s.label}</div>
                    <div style={{ fontSize:11, color:'#94A3B8' }}>
                      {s.rowCount} reqs · uploaded {formatDate(new Date(s.uploadedAt))}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Upload */}
        <button
          className="btn btn-secondary"
          style={{ height:34, fontSize:12 }}
          onClick={() => router.push('/dashboard/upload')}
        >
          <Upload size={13} />
          Upload
        </button>

        {/* Actions slot */}
        {actions}

        {/* User badge */}
        <div style={{
          height:32, width:32, borderRadius:'50%',
          background:'#0F4C81', display:'flex', alignItems:'center', justifyContent:'center',
          color:'white', fontSize:13, fontWeight:700, flexShrink:0,
          cursor:'default',
        }}
        title={session?.name}
        >
          {session?.name?.charAt(0) ?? 'U'}
        </div>
      </div>
    </header>
  );
}
