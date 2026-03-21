import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { TrendingUp, User, Mail, Lock, ArrowRight } from 'lucide-react';
import api from '../api';
import toast from 'react-hot-toast';

export default function Register() {
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const submit = async e => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/auth/register', form);
            toast.success('Account created! Please login.');
            navigate('/login');
        } catch {
            toast.error('Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const fields = [
        { key: 'name', label: 'Full name', type: 'text', icon: User, placeholder: 'John Doe' },
        { key: 'email', label: 'Email address', type: 'email', icon: Mail, placeholder: 'you@example.com' },
        { key: 'password', label: 'Password', type: 'password', icon: Lock, placeholder: 'Min 8 characters' },
    ];

    return (
        <div style={{
            minHeight: '100vh', background: '#0f0f1a',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
            <div style={{
                position: 'fixed', top: '-20%', right: '-10%',
                width: 500, height: 500,
                background: 'radial-gradient(circle, rgba(79,70,229,0.15) 0%, transparent 70%)',
                pointerEvents: 'none',
            }} />

            <div style={{
                width: '100%', maxWidth: 420,
                background: 'rgba(255,255,255,0.04)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 24, padding: 40,
                animation: 'fadeInUp 0.4s ease forwards',
            }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{
                        width: 56, height: 56,
                        background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                        borderRadius: 16,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 16px',
                        boxShadow: '0 0 30px rgba(79,70,229,0.4)',
                    }}>
                        <TrendingUp size={28} color="white" />
                    </div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>Create account</h1>
                    <p style={{ fontSize: 14, color: '#64748b' }}>Start tracking your finances today</p>
                </div>

                <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {fields.map(({ key, label, type, icon: Icon, placeholder }) => (
                        <div key={key}>
                            <label style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500, display: 'block', marginBottom: 8 }}>
                                {label}
                            </label>
                            <div style={{ position: 'relative' }}>
                                <Icon size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                                <input
                                    type={type} placeholder={placeholder} value={form[key]}
                                    onChange={e => setForm({ ...form, [key]: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: '12px 14px 12px 42px', fontSize: 14 }}
                                />
                            </div>
                        </div>
                    ))}

                    <button type="submit" disabled={loading}
                        style={{
                            marginTop: 8,
                            background: loading ? '#374151' : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                            color: 'white', border: 'none', borderRadius: 12,
                            padding: '13px', fontSize: 15, fontWeight: 600,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        }}>
                        {loading ? 'Creating...' : <><span>Create account</span><ArrowRight size={16} /></>}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: '#64748b' }}>
                    Already have an account?{' '}
                    <Link to="/login" style={{ color: '#a78bfa', fontWeight: 600, textDecoration: 'none' }}>
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}