'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('rima.ali@netscribes.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 300)); // slight delay for UX
    const user = login(email, password);
    setLoading(false);
    if (!user) {
      setError('Invalid email or password. Try: rima.ali@netscribes.com / Passw0rd');
      return;
    }
    router.replace('/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
      <div style={{ width: 400 }}>
        {/* Logo / brand */}
        <div className="text-center mb-8">
          <div style={{
            display:'inline-flex', alignItems:'center', justifyContent:'center',
            width:52, height:52, borderRadius:12,
            background:'var(--primary)', marginBottom:16,
          }}>
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
              <path d="M17 20H7a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v12a2 2 0 01-2 2z" stroke="white" strokeWidth="2"/>
              <path d="M9 10h6M9 14h4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 style={{ fontSize:22, fontWeight:700, color:'#0F172A', marginBottom:4 }}>
            TA Performance Dashboard
          </h1>
          <p style={{ color:'#64748B', fontSize:14 }}>Netscribes · Cut 1 Demo</p>
        </div>

        {/* Card */}
        <div style={{ background:'white', borderRadius:12, padding:32, border:'1px solid #E2E8F0', boxShadow:'0 4px 12px rgba(0,0,0,0.06)' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom:18 }}>
              <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#374151', marginBottom:6 }}>
                Email address
              </label>
              <input
                className="input"
                style={{ width:'100%' }}
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@netscribes.com"
              />
            </div>

            <div style={{ marginBottom:24 }}>
              <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#374151', marginBottom:6 }}>
                Password
              </label>
              <input
                className="input"
                style={{ width:'100%' }}
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:6, padding:'10px 14px', marginBottom:18, fontSize:13, color:'#B91C1C' }}>
                {error}
              </div>
            )}

            <button
              className="btn btn-primary"
              style={{ width:'100%', justifyContent:'center', height:40, fontSize:15 }}
              type="submit"
              disabled={loading}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div style={{ marginTop:20, padding:'14px 0 0', borderTop:'1px solid #F1F5F9', textAlign:'center' }}>
            <p style={{ fontSize:12, color:'#94A3B8' }}>
              Demo credentials: rima.ali@netscribes.com / Passw0rd
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
