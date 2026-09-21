'use client';
import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Card, CardHeader } from '@/components/ui';
import { Save, Plus, X } from 'lucide-react';

export default function SettingsPage() {
  const { settings, updateSettings } = useAppStore();

  const [amber, setAmber] = useState(settings.amberThresholdPct);
  const [stalled, setStalled] = useState(settings.stalledDays);
  const [bucketStr, setBucketStr] = useState(settings.ageBuckets.join(', '));
  const [holidayInput, setHolidayInput] = useState('');
  const [saved, setSaved] = useState(false);

  const holidays = settings.holidayCalendar;

  function saveGeneral() {
    const buckets = bucketStr
      .split(',')
      .map(s => parseInt(s.trim()))
      .filter(n => !isNaN(n) && n > 0)
      .sort((a, b) => a - b);

    updateSettings({
      amberThresholdPct: Math.max(1, Math.min(99, amber)),
      stalledDays: Math.max(1, stalled),
      ageBuckets: buckets.length > 0 ? buckets : [15, 30, 45],
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function addHoliday() {
    const d = holidayInput.trim();
    if (!d || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return;
    if (holidays.includes(d)) return;
    updateSettings({ holidayCalendar: [...holidays, d].sort() });
    setHolidayInput('');
  }

  function removeHoliday(d: string) {
    updateSettings({ holidayCalendar: holidays.filter(h => h !== d) });
  }

  const INDIA_2026_HOLIDAYS = [
    '2026-01-26','2026-03-17','2026-04-10','2026-04-14',
    '2026-08-15','2026-10-02','2026-10-20','2026-11-04',
    '2026-12-25',
  ];

  function loadIndiaHolidays() {
    const merged = [...new Set([...holidays, ...INDIA_2026_HOLIDAYS])].sort();
    updateSettings({ holidayCalendar: merged });
  }

  return (
    <div style={{ maxWidth: 680 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', margin: 0 }}>Settings</h1>
        <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>Metric thresholds and calendar configuration</p>
      </div>

      {/* TAT & Thresholds */}
      <Card style={{ marginBottom: 20 }}>
        <CardHeader title="TAT & Ageing Thresholds" />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              Amber threshold (% of TAT remaining)
            </label>
            <input
              type="number"
              className="input"
              value={amber}
              min={1}
              max={99}
              onChange={e => setAmber(Number(e.target.value))}
              style={{ width: '100%' }}
            />
            <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>
              Reqs with ≤ {amber}% of TAT buffer left are flagged amber.
            </p>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              Stalled threshold (days)
            </label>
            <input
              type="number"
              className="input"
              value={stalled}
              min={1}
              onChange={e => setStalled(Number(e.target.value))}
              style={{ width: '100%' }}
            />
            <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>
              Active reqs with no sourcing activity after {stalled} days are flagged stalled.
            </p>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
            Ageing bucket breaks (comma-separated business days)
          </label>
          <input
            type="text"
            className="input"
            value={bucketStr}
            onChange={e => setBucketStr(e.target.value)}
            placeholder="e.g. 15, 30, 45"
            style={{ width: '100%' }}
          />
          <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>
            Defines bucket boundaries for the Ageing chart. Example: 15, 30, 45 → 0–15d, 16–30d, 31–45d, 46d+
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="btn btn-primary" onClick={saveGeneral}>
            <Save size={14} /> Save settings
          </button>
          {saved && <span style={{ fontSize: 13, color: '#16A34A', fontWeight: 600 }}>✓ Saved</span>}
        </div>
      </Card>

      {/* Holiday calendar */}
      <Card>
        <CardHeader
          title="Holiday Calendar"
          subtitle="Business-day calculations exclude these dates"
        />

        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input
              type="date"
              className="input"
              value={holidayInput}
              onChange={e => setHolidayInput(e.target.value)}
              style={{ flex: 1 }}
            />
            <button className="btn btn-primary" onClick={addHoliday} style={{ height: 36 }}>
              <Plus size={14} /> Add
            </button>
          </div>
          <button className="btn btn-secondary" style={{ fontSize: 12, height: 30 }} onClick={loadIndiaHolidays}>
            Load India 2026 public holidays
          </button>
        </div>

        {holidays.length === 0 ? (
          <p style={{ fontSize: 13, color: '#94A3B8' }}>No holidays configured. All weekdays count as business days.</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {holidays.map(h => (
              <div key={h} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: '#F1F5F9', borderRadius: 6, padding: '4px 10px', fontSize: 13,
              }}>
                <span>{h}</span>
                <button
                  onClick={() => removeHoliday(h)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: '#94A3B8' }}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Demo credentials */}
      <Card style={{ marginTop: 20 }}>
        <CardHeader title="Demo Credentials" subtitle="Rotate before using with real data" />
        <div style={{ background: '#FFF7ED', borderRadius: 6, padding: 12, fontSize: 13, color: '#92400E', fontFamily: 'monospace' }}>
          <div>Email: rima.ali@netscribes.com</div>
          <div>Password: Passw0rd</div>
        </div>
        <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 8 }}>
          ⚠ These credentials are hardcoded for demo use. Do not use with real HR data until you replace them in <code>lib/auth.ts</code>.
        </p>
      </Card>
    </div>
  );
}
