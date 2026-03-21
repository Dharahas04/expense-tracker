import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Receipt, PiggyBank, Target, LogOut, TrendingUp, Bell, IndianRupee } from 'lucide-react';

export default function Layout() {
    const navigate = useNavigate();
    const logout = () => { localStorage.clear(); navigate('/login'); };
    const name = localStorage.getItem('name') || 'User';
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    const nav = [
        { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/expenses', icon: Receipt, label: 'Expenses' },
        { to: '/budget', icon: PiggyBank, label: 'Budget' },
        { to: '/savings', icon: Target, label: 'Savings' },
        { to: '/income', icon: IndianRupee, label: 'Income' },
    ];

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#0f0f1a' }}>

            {/* Sidebar */}
            <aside style={{
                width: 260,
                background: 'linear-gradient(180deg, #13132a 0%, #0f0f1a 100%)',
                borderRight: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                flexDirection: 'column',
                padding: '24px 16px',
                position: 'sticky',
                top: 0,
                height: '100vh',
            }}>

                {/* Logo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 36, padding: '0 8px' }}>
                    <div style={{
                        width: 38, height: 38,
                        background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                        borderRadius: 10,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 0 20px rgba(79,70,229,0.4)',
                    }}>
                        <TrendingUp size={20} color="white" />
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: 16, color: '#e2e8f0' }}>ExpenseTracker</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>Financial Dashboard</div>
                    </div>
                </div>

                {/* Nav */}
                <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ fontSize: 11, color: '#475569', fontWeight: 600, letterSpacing: '0.08em', padding: '0 8px', marginBottom: 8 }}>
                        MAIN MENU
                    </div>
                    {nav.map(({ to, icon: Icon, label }) => (
                        <NavLink key={to} to={to} end={to === '/'}
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                            <Icon size={18} />
                            {label}
                        </NavLink>
                    ))}
                </nav>

                {/* User */}
                <div style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 14,
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                }}>
                    <div style={{
                        width: 36, height: 36,
                        background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                        borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 700, color: 'white',
                        flexShrink: 0,
                    }}>{initials}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>Free plan</div>
                    </div>
                    <button onClick={logout} title="Logout"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 4 }}>
                        <LogOut size={16} />
                    </button>
                </div>
            </aside>

            {/* Main */}
            <main style={{ flex: 1, overflowY: 'auto' }}>
                {/* Top bar */}
                <div style={{
                    padding: '20px 32px',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: 12,
                    background: 'rgba(15,15,26,0.8)',
                    backdropFilter: 'blur(10px)',
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                }}>
                    <button style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 10,
                        padding: '8px 10px',
                        cursor: 'pointer',
                        color: '#94a3b8',
                    }}>
                        <Bell size={16} />
                    </button>
                    <div style={{
                        background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                        borderRadius: 10,
                        padding: '8px 16px',
                        fontSize: 13,
                        fontWeight: 600,
                        color: 'white',
                    }}>
                        {new Date().toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                </div>

                <div style={{ padding: '32px' }}>
                    <Outlet />
                </div>
            </main>
        </div>
    );
}