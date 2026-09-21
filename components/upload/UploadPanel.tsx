'use client';
import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { parseFile } from '@/lib/parser';
import { useAppStore } from '@/lib/store';
import { getSampleCSV } from '@/lib/sampleData';
import { Snapshot, ParseResult } from '@/lib/types';
import { toISODateStr } from '@/lib/businessDays';
import { Upload, CheckCircle, AlertTriangle, XCircle, FileSpreadsheet, Download } from 'lucide-react';
import { Spinner } from '@/components/ui';
import { downloadSampleTemplate } from '@/lib/export';

export default function UploadPanel() {
  const router = useRouter();
  const { addSnapshot, settings } = useAppStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [asOfDate, setAsOfDate] = useState(toISODateStr(new Date()));
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [error, setError] = useState('');

  async function processFile(f: File) {
    setFile(f);
    setResult(null);
    setError('');
    setLoading(true);
    try {
      const asOf = new Date(asOfDate || toISODateStr(new Date()));
      const snapshotId = `snap_${Date.now()}`;
      const parsed = await parseFile(f, snapshotId, asOf, settings);
      setResult(parsed);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Parse error');
    } finally {
      setLoading(false);
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) processFile(f);
  }

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) processFile(f);
  }

  async function loadSampleData() {
    setError('');
    setLoading(true);
    try {
      const csvStr = getSampleCSV();
      const f = new File([csvStr], 'sample_requisitions.csv', { type: 'text/csv' });
      setFile(f);
      const asOf = new Date('2026-09-21');
      setAsOfDate('2026-09-21');
      const snapshotId = `snap_sample_${Date.now()}`;
      const parsed = await parseFile(f, snapshotId, asOf, settings);
      setResult(parsed);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error loading sample data');
    } finally {
      setLoading(false);
    }
  }

  function confirmImport() {
    if (!result || !file) return;
    const asOf = new Date(asOfDate);
    const snapshotId = `snap_${Date.now()}`;
    // Re-stamp the snapshot id
    const reqs = result.requisitions.map(r => ({ ...r, snapshotId, asOfDate: asOf }));
    const snap: Snapshot = {
      id: snapshotId,
      uploadedAt: new Date().toISOString(),
      asOfDate: asOf.toISOString(),
      label: `${file.name} · ${asOf.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}`,
      requisitions: reqs,
      rowCount: reqs.length,
      errorRows: result.skippedRows,
    };
    addSnapshot(snap);
    router.push('/dashboard');
  }

  const hasErrors = !!error || (result?.errors.length ?? 0) > 0;
  const canImport = result && result.requisitions.length > 0 && !hasErrors;

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>

      {/* Instructional panel */}
      <div style={{ background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:8, padding:18, marginBottom:24 }}>
        <div style={{ fontSize:13, fontWeight:700, color:'#1D4ED8', marginBottom:8 }}>
          How to get the export from CoEfficient
        </div>
        <ol style={{ paddingLeft:18, fontSize:13, color:'#1E40AF', margin:0, lineHeight:1.9 }}>
          <li>Go to <b>Requisitions → Reports → Export</b></li>
          <li>Select the date range and all divisions</li>
          <li>Download as <b>CSV</b> or <b>XLSX</b></li>
          <li>Upload below — the app maps all standard columns automatically</li>
        </ol>
        <div style={{ marginTop:12, display:'flex', gap:10, alignItems:'center' }}>
          <button className="btn btn-secondary" style={{ height:30, fontSize:12 }}
            onClick={() => downloadSampleTemplate()}>
            <Download size={12} /> Download template
          </button>
          <span style={{ fontSize:12, color:'#94A3B8' }}>Required columns: ID, Req_Raised, HR_Approval_Date, Status, Division, TA_Members …</span>
        </div>
      </div>

      {/* As-of date */}
      <div style={{ marginBottom:20 }}>
        <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#374151', marginBottom:6 }}>
          Snapshot as-of date
        </label>
        <input
          type="date"
          className="input"
          value={asOfDate}
          onChange={e => setAsOfDate(e.target.value)}
          style={{ width:200 }}
        />
        <p style={{ fontSize:12, color:'#94A3B8', marginTop:4 }}>
          Ageing is calculated relative to this date.
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
        style={{
          border:`2px dashed ${dragging ? '#0F4C81' : '#CBD5E1'}`,
          borderRadius:10,
          padding:'36px 24px',
          textAlign:'center',
          cursor:'pointer',
          background: dragging ? '#EFF6FF' : '#FAFAFA',
          transition:'all 0.15s',
          marginBottom:16,
        }}
      >
        <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" style={{ display:'none' }} onChange={onFileChange} />
        <Upload size={32} style={{ color: dragging ? '#0F4C81' : '#CBD5E1', marginBottom:12 }} />
        <div style={{ fontSize:15, fontWeight:600, color:'#0F172A', marginBottom:6 }}>
          {file ? file.name : 'Drop CSV or XLSX here, or click to browse'}
        </div>
        <div style={{ fontSize:12, color:'#94A3B8' }}>
          Max 20 MB · CSV, XLSX, XLS
        </div>
      </div>

      {/* OR use sample */}
      <div style={{ textAlign:'center', marginBottom:24 }}>
        <span style={{ fontSize:13, color:'#94A3B8' }}>or </span>
        <button
          className="btn btn-ghost"
          style={{ fontSize:13, height:30, textDecoration:'underline' }}
          onClick={loadSampleData}
          disabled={loading}
        >
          Load sample data (80 demo reqs)
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:16, background:'#F8FAFC', borderRadius:8, marginBottom:16 }}>
          <Spinner />
          <span style={{ fontSize:13, color:'#475569' }}>Parsing file…</span>
        </div>
      )}

      {/* Hard error */}
      {error && (
        <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:8, padding:16, marginBottom:16 }}>
          <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
            <XCircle size={18} style={{ color:'#DC2626', flexShrink:0, marginTop:1 }} />
            <div style={{ fontSize:13, color:'#B91C1C' }}>{error}</div>
          </div>
        </div>
      )}

      {/* Validation report */}
      {result && !error && (
        <div style={{ border:'1px solid #E2E8F0', borderRadius:8, overflow:'hidden', marginBottom:20 }}>
          <div style={{ padding:'14px 18px', background:'#F8FAFC', borderBottom:'1px solid #E2E8F0', fontWeight:700, fontSize:14 }}>
            📋 Parse summary
          </div>

          <div style={{ padding:'14px 18px' }}>
            <Row icon={<CheckCircle size={15} style={{color:'#16A34A'}} />} color="#16A34A"
              text={`${result.requisitions.length} requisitions parsed`} />

            {result.columnsMapped.length > 0 && (
              <Row icon={<CheckCircle size={15} style={{color:'#16A34A'}} />} color="#16A34A"
                text={`${result.columnsMapped.length} columns recognised`} />
            )}

            {result.columnsUnrecognized.length > 0 && (
              <Row icon={<AlertTriangle size={15} style={{color:'#D97706'}} />} color="#D97706"
                text={`${result.columnsUnrecognized.length} columns not recognised (ignored): ${result.columnsUnrecognized.slice(0,5).join(', ')}${result.columnsUnrecognized.length > 5 ? '…' : ''}`} />
            )}

            {result.inferredTatCount > 0 && (
              <Row icon={<AlertTriangle size={15} style={{color:'#D97706'}} />} color="#D97706"
                text={`${result.inferredTatCount} reqs using inferred TAT (Request_DOJ fallback) — badged in table`} />
            )}

            {result.unassignedCount > 0 && (
              <Row icon={<AlertTriangle size={15} style={{color:'#D97706'}} />} color="#D97706"
                text={`${result.unassignedCount} reqs without TA assignment → Unassigned bucket`} />
            )}

            {result.skippedRows > 0 && (
              <Row icon={<XCircle size={15} style={{color:'#DC2626'}} />} color="#DC2626"
                text={`${result.skippedRows} rows skipped (empty or parse error)`} />
            )}

            {result.errors.map((e, i) => (
              <Row key={i} icon={<XCircle size={15} style={{color:'#DC2626'}} />} color="#DC2626" text={e} />
            ))}

            {result.warnings.slice(0, 5).map((w, i) => (
              <Row key={i} icon={<AlertTriangle size={15} style={{color:'#D97706'}} />} color="#D97706" text={w} />
            ))}
            {result.warnings.length > 5 && (
              <div style={{ fontSize:12, color:'#94A3B8', paddingLeft:24 }}>
                … and {result.warnings.length - 5} more warnings
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display:'flex', gap:12, justifyContent:'flex-end' }}>
        <button className="btn btn-secondary" onClick={() => router.push('/dashboard')}>
          Cancel
        </button>
        <button
          className="btn btn-primary"
          onClick={confirmImport}
          disabled={!canImport}
          style={{ minWidth:140 }}
        >
          <FileSpreadsheet size={14} />
          Import {result?.requisitions.length ? `${result.requisitions.length} reqs` : ''}
        </button>
      </div>
    </div>
  );
}

function Row({ icon, color, text }: { icon: React.ReactNode; color: string; text: string }) {
  return (
    <div style={{ display:'flex', gap:10, alignItems:'flex-start', padding:'6px 0' }}>
      <span style={{ flexShrink:0, marginTop:1 }}>{icon}</span>
      <span style={{ fontSize:13, color:'#374151' }}>{text}</span>
    </div>
  );
}
