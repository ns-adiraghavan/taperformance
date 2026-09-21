'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { logout } from '@/lib/auth';
import {
  LayoutDashboard, FileText, Users, Clock, TrendingUp,
  AlertTriangle, Settings, LogOut, ChevronRight
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard',               label: 'Overview',        icon: LayoutDashboard, exact: true },
  { href: '/dashboard/requisitions',  label: 'Requisitions',    icon: FileText },
  { href: '/dashboard/ta-performance',label: 'TA Performance',  icon: Users },
  { href: '/dashboard/ageing',        label: 'Ageing & TAT',    icon: Clock },
  { href: '/dashboard/trends',        label: 'Trends',          icon: TrendingUp },
  { href: '/dashboard/exceptions',    label: 'Exceptions',      icon: AlertTriangle },
  { href: '/dashboard/settings',      label: 'Settings',        icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push('/login');
  }

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <aside style={{
      width: 224,
      minWidth: 224,
      background: '#0F4C81',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 40,
    }}>
      {/* Brand */}
      <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{
            width:34, height:34, borderRadius:8,
            background:'rgba(255,255,255,0.15)',
            display:'flex', alignItems:'center', justifyContent:'center',
            flexShrink:0,
          }}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
              <path d="M17 20H7a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v12a2 2 0 01-2 2z" stroke="white" strokeWidth="2"/>
              <path d="M9 10h6M9 14h4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:'white', lineHeight:1.2 }}>TA Dashboard</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.55)', lineHeight:1.3 }}>Netscribes · Cut 1</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding:'12px 10px', flex:1, overflowY:'auto' }}>
        {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => (
          <Link
            key={href}
            href={href}
            className={`nav-link ${isActive(href, exact) ? 'active' : ''}`}
            style={{ marginBottom:2 }}
          >
            <Icon size={16} />
            <span>{label}</span>
            {isActive(href, exact) && (
              <ChevronRight size={14} style={{ marginLeft:'auto', opacity:0.7 }} />
            )}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding:'12px 10px', borderTop:'1px solid rgba(255,255,255,0.1)' }}>
        <button
          onClick={handleLogout}
          className="nav-link"
          style={{ width:'100%', border:'none', background:'transparent', cursor:'pointer' }}
        >
          <LogOut size={16} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
