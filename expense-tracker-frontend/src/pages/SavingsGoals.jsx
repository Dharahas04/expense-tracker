import { useEffect, useState } from 'react';
import { Plus, Trash2, Target, X } from 'lucide-react';
import api from '../api';
import toast from 'react-hot-toast';

export default function SavingsGoals() {
    const [goals, setGoals] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ name: '', targetAmount: '', currentAmount: '', targetDate: '' });

    const load = () => api.get('/savings').then(r => setGoals(r.data));
    useEffect(() => { load(); }, []);

    const save = async e => {
        e.preventDefault();
        try {
            await api.post('/savings', form);
            toast.success('Goal created!');
            setShowForm(false);
            setForm({ name: '', targetAmount: '', currentAmount: '', targetDate: '' });
            load();
        } catch { toast.error('Failed to create goal'); }
    };

    const del = async id => {
        if (!window.confirm('Delete this goal?')) return;
        await api.delete(`/savings/${id}`);
        toast.success('Goal deleted');
        load();
    };

    const goalIcons = ['🎯', '✈️', '🏠', '🚗', '💻', '📱', '🎓', '💍', '🏖️', '💰'];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e2e8f0' }}>Savings goals</h1>
                    <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
                        {goals.length} active {goals.length === 1 ? 'goal' : 'goals'}
                    </p>
                </div>
                <button onClick={() => setShowForm(!showForm)}
                    style={{
                        background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                        color: 'white', border: 'none', borderRadius: 12,
                        padding: '10px 18px', fontSize: 14, fontWeight: 600,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                        boxShadow: '0 4px 15px rgba(79,70,229,0.3)',
                    }}>
                    <Plus size={16} /> New goal
                </button>
            </div>

            {/* Form */}
            {showForm && (
                <div style={{
                    background: 'rgba(255,255,255,0.05)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 20, padding: 28,
                    animation: 'fadeInUp 0.3s ease',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#e2e8f0' }}>Create new goal</h3>
                        <button onClick={() => setShowForm(false)} style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 8, padding: '6px 8px', cursor: 'pointer', color: '#94a3b8',
                        }}>
                            <X size={16} />
                        </button>
                    </div>

                    <form onSubmit={save}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500, display: 'block', marginBottom: 6 }}>
                                    Goal name
                                </label>
                                <input
                                    placeholder="e.g. New laptop, Vacation, Emergency fund"
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: '11px 14px', fontSize: 14, borderRadius: 10 }}
                                />
                            </div>

                            <div>
                                <label style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500, display: 'block', marginBottom: 6 }}>
                                    Target amount (₹)
                                </label>
                                <input
                                    type="number"
                                    placeholder="e.g. 50000"
                                    value={form.targetAmount}
                                    onChange={e => setForm({ ...form, targetAmount: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: '11px 14px', fontSize: 14, borderRadius: 10 }}
                                />
                            </div>

                            <div>
                                <label style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500, display: 'block', marginBottom: 6 }}>
                                    Already saved (₹)
                                </label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={form.currentAmount}
                                    onChange={e => setForm({ ...form, currentAmount: e.target.value })}
                                    style={{ width: '100%', padding: '11px 14px', fontSize: 14, borderRadius: 10 }}
                                />
                            </div>

                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500, display: 'block', marginBottom: 6 }}>
                                    Target date (optional)
                                </label>
                                <input
                                    type="date"
                                    value={form.targetDate}
                                    onChange={e => setForm({ ...form, targetDate: e.target.value })}
                                    style={{ width: '100%', padding: '11px 14px', fontSize: 14, borderRadius: 10 }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                            <button type="submit" style={{
                                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                                color: 'white', border: 'none', borderRadius: 10,
                                padding: '11px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                            }}>
                                Create goal
                            </button>
                            <button type="button" onClick={() => setShowForm(false)} style={{
                                background: 'rgba(255,255,255,0.05)',
                                color: '#94a3b8',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: 10, padding: '11px 20px', fontSize: 14, cursor: 'pointer',
                            }}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Empty state */}
            {goals.length === 0 && !showForm && (
                <div style={{
                    textAlign: 'center', padding: '60px 24px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px dashed rgba(255,255,255,0.1)',
                    borderRadius: 16,
                }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div>
                    <div style={{ fontSize: 15, fontWeight: 500, color: '#64748b' }}>No savings goals yet</div>
                    <div style={{ fontSize: 13, color: '#475569', marginTop: 4 }}>
                        Create your first goal to start tracking your savings
                    </div>
                </div>
            )}

            {/* Goals grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
                {goals.map((g, idx) => {
                    const current = Number(g.currentAmount || 0);
                    const target = Number(g.targetAmount);
                    const pct = Math.min((current / target) * 100, 100);
                    const done = pct >= 100;
                    const icon = goalIcons[idx % goalIcons.length];

                    const daysLeft = g.targetDate
                        ? Math.ceil((new Date(g.targetDate) - new Date()) / (1000 * 60 * 60 * 24))
                        : null;

                    return (
                        <div key={g.id} style={{
                            background: 'rgba(255,255,255,0.04)',
                            border: `1px solid ${done ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.07)'}`,
                            borderRadius: 16, padding: 24,
                            transition: 'all 0.2s ease',
                            animation: 'fadeInUp 0.4s ease forwards',
                        }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'rgba(79,70,229,0.3)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = done ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.07)'; }}>

                            {/* Card header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{
                                        width: 46, height: 46, borderRadius: 14,
                                        background: done ? 'rgba(16,185,129,0.2)' : 'rgba(79,70,229,0.2)',
                                        border: `1px solid ${done ? 'rgba(16,185,129,0.3)' : 'rgba(79,70,229,0.3)'}`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 22,
                                    }}>
                                        {done ? '✅' : icon}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0' }}>{g.name}</div>
                                        {daysLeft !== null && (
                                            <div style={{ fontSize: 11, color: daysLeft < 30 ? '#f87171' : '#64748b', marginTop: 2 }}>
                                                {daysLeft > 0 ? `${daysLeft} days left` : 'Deadline passed'}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <button onClick={() => del(g.id)} style={{
                                    background: 'rgba(248,113,113,0.1)',
                                    border: '1px solid rgba(248,113,113,0.2)',
                                    borderRadius: 8, padding: '5px 7px',
                                    cursor: 'pointer', color: '#f87171',
                                }}>
                                    <Trash2 size={13} />
                                </button>
                            </div>

                            {/* Amount display */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                <div>
                                    <div style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0' }}>
                                        ₹{current.toLocaleString()}
                                    </div>
                                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                                        of ₹{target.toLocaleString()} goal
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{
                                        fontSize: 22, fontWeight: 700,
                                        color: done ? '#10b981' : '#a78bfa',
                                    }}>
                                        {Math.round(pct)}%
                                    </div>
                                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>complete</div>
                                </div>
                            </div>

                            {/* Progress bar */}
                            <div style={{
                                background: 'rgba(255,255,255,0.06)',
                                borderRadius: 999, height: 10, overflow: 'hidden',
                            }}>
                                <div className="progress-bar" style={{
                                    height: '100%', borderRadius: 999,
                                    width: `${pct}%`,
                                    background: done
                                        ? 'linear-gradient(90deg, #10b981, #34d399)'
                                        : 'linear-gradient(90deg, #4f46e5, #7c3aed)',
                                    boxShadow: done
                                        ? '0 0 10px rgba(16,185,129,0.4)'
                                        : '0 0 10px rgba(79,70,229,0.4)',
                                    transition: 'width 1s cubic-bezier(0.4,0,0.2,1)',
                                }} />
                            </div>

                            {/* Bottom info */}
                            <div style={{ marginTop: 12, fontSize: 12, color: '#64748b' }}>
                                {done
                                    ? '🎉 Goal achieved!'
                                    : `₹${(target - current).toLocaleString()} more to go`}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}