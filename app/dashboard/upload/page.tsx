'use client';
import UploadPanel from '@/components/upload/UploadPanel';

export default function UploadPage() {
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', margin: 0 }}>Upload Snapshot</h1>
        <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>Import a CoEfficient requisition export to refresh the dashboard.</p>
      </div>
      <UploadPanel />
    </div>
  );
}
