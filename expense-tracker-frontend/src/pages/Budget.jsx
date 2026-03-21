import { useEffect, useState } from 'react';
import { Plus, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import api from '../api';
import toast from 'react-hot-toast';

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Health', 'Entertainment', 'Utilities', 'Rent', 'Other'];
const catColors = {
    Food: '#f59e0b', Transport: '#06b6d4', Shopping: '#ec4899',
    Health: '#10b981', Entertainment: '#f43f5e', Utilities: '#8b5cf6',
    Rent: '#4f46e5', Other: '#64748b',
};

export default function Budget() {
    const [budgets, setBudgets] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [form, setForm] = useState({ category: 'Food', limitAmount: '', period: 'MONTHLY' });
    const [showForm, setShowForm] = useState(false);
    const [bulkForm, setBulkForm] = useState({});

    const saveBulk = async () => {
        const entries = Object.entries(bulkForm).filter(([, v]) => v && Number(v) > 0);
        if (entries.length === 0) {
            toast.error('Enter at least one amount');
            return;
        }
        try {
            await Promise.all(
                entries.map(([category, limitAmount]) =>
                    api.post('/budgets', { category, limitAmount: Number(limitAmount), period: 'MONTHLY' })
                )
            );
            toast.success(`${entries.length} budget${entries.length > 1 ? 's' : ''} saved!`);
            setShowForm(false);
            setBulkForm({});
            load();
        } catch {
            toast.error('Failed to save budgets');
        }
    };

    const load = async () => {
        try {
            const [b, e] = await Promise.all([api.get('/budgets'), api.get('/expenses')]);
            setBudgets(Array.isArray(b.data) ? b.data : []);
            setExpenses(Array.isArray(e.data) ? e.data : []);
        } catch {
            setBudgets([]);
            setExpenses([]);
        }
    };

    useEffect(() => { load(); }, []);

    const spent = cat => (Array.isArray(expenses) ? expenses : [])
        .filter(e => e.category === cat && e.type === 'EXPENSE')
        .reduce((s, e) => s + Number(e.amount), 0);

    const save = async ev => {
        ev.preventDefault();
        try {
            await api.post('/budgets', form);
            toast.success('Budget set!');
            setShowForm(false);
            load();
        } catch { toast.error('Failed'); }
    };

    const del = async id => {
        await api.delete(`/budgets/${id}`);
        toast.success('Deleted');
        load();
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e2e8f0' }}>Budget</h1>
                    <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Set limits per category for this month</p>
                </div>
                <button onClick={() => setShowForm(!showForm)} style={{
                    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                    color: 'white', border: 'none', borderRadius: 12,
                    padding: '10px 18px', fontSize: 14, fontWeight: 600,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                    boxShadow: '0 4px 15px rgba(79,70,229,0.3)',
                }}>
                    <Plus size={16} /> Set budget
                </button>
            </div>

            {showForm && (
                <div style={{
                    background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 24,
                    animation: 'fadeInUp 0.3s ease',
                }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 6 }}>
                        Set budgets for all categories
                    </h3>
                    <p style={{ fontSize: 12, color: '#64748b', marginBottom: 20 }}>
                        Leave blank to skip a category
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
                        {CATEGORIES.map(cat => {
                            const icons = {
                                Food: '🍔', Transport: '🚗', Shopping: '🛍️', Health: '💊',
                                Entertainment: '🎬', Utilities: '⚡', Rent: '🏠', Other: '💰'
                            };
                            const existing = budgets.find(b => b.category === cat);
                            return (
                                <div key={cat} style={{
                                    background: 'rgba(255,255,255,0.03)',
                                    border: `1px solid ${catColors[cat]}33`,
                                    borderRadius: 12, padding: '14px 16px',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                        <span style={{ fontSize: 18 }}>{icons[cat]}</span>
                                        <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{cat}</span>
                                        {existing && (
                                            <span style={{
                                                marginLeft: 'auto', fontSize: 11,
                                                background: `${catColors[cat]}22`,
                                                color: catColors[cat],
                                                border: `1px solid ${catColors[cat]}44`,
                                                borderRadius: 6, padding: '2px 8px',
                                            }}>
                                                Current: ₹{Number(existing.limitAmount).toLocaleString()}
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ position: 'relative' }}>
                                        <span style={{
                                            position: 'absolute', left: 12, top: '50%',
                                            transform: 'translateY(-50%)',
                                            fontSize: 13, color: '#64748b', fontWeight: 500,
                                        }}>₹</span>
                                        <input
                                            type="number"
                                            placeholder={existing ? existing.limitAmount : '0'}
                                            value={bulkForm[cat] || ''}
                                            onChange={e => setBulkForm(prev => ({ ...prev, [cat]: e.target.value }))}
                                            style={{
                                                width: '100%', padding: '9px 12px 9px 26px',
                                                fontSize: 13, borderRadius: 8,
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={saveBulk} style={{
                            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                            color: 'white', border: 'none', borderRadius: 10,
                            padding: '11px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                        }}>
                            Save all budgets
                        </button>
                        <button onClick={() => { setShowForm(false); setBulkForm({}); }} style={{
                            background: 'rgba(255,255,255,0.05)', color: '#94a3b8',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 10, padding: '11px 20px', fontSize: 14, cursor: 'pointer',
                        }}>
                            Cancel
                        </button>
                    </div>
                </div>
            )}
            {budgets.length === 0 && !showForm && (
                <div style={{
                    textAlign: 'center', padding: '60px 24px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px dashed rgba(255,255,255,0.1)',
                    borderRadius: 16,
                }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
                    <div style={{ fontSize: 15, fontWeight: 500, color: '#64748b' }}>No budgets set yet</div>
                    <div style={{ fontSize: 13, color: '#475569', marginTop: 4 }}>Click "Set budget" to create your first one</div>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
                {budgets.map(b => {
                    const s = spent(b.category);
                    const limit = Number(b.limitAmount);
                    const pct = Math.min((s / limit) * 100, 100);
                    const over = s > limit;
                    const color = over ? '#f43f5e' : pct > 75 ? '#f59e0b' : catColors[b.category] || '#4f46e5';

                    return (
                        <div key={b.id} style={{
                            background: 'rgba(255,255,255,0.04)',
                            border: `1px solid ${over ? 'rgba(244,63,94,0.3)' : 'rgba(255,255,255,0.07)'}`,
                            borderRadius: 16, padding: 24,
                            transition: 'all 0.2s ease',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{
                                        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                                        background: `${catColors[b.category] || '#64748b'}22`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                                    }}>
                                        {b.category === 'Food' ? '🍔' : b.category === 'Transport' ? '🚗' :
                                            b.category === 'Shopping' ? '🛍️' : b.category === 'Health' ? '💊' :
                                                b.category === 'Entertainment' ? '🎬' : b.category === 'Rent' ? '🏠' : '💰'}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0' }}>{b.category}</div>
                                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                                            ₹{s.toLocaleString()} of ₹{limit.toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    {over
                                        ? <AlertTriangle size={16} color="#f43f5e" />
                                        : <CheckCircle size={16} color="#10b981" />}
                                    <button onClick={() => del(b.id)} style={{
                                        background: 'rgba(248,113,113,0.1)',
                                        border: '1px solid rgba(248,113,113,0.2)',
                                        borderRadius: 8, padding: '4px 6px', cursor: 'pointer', color: '#f87171',
                                    }}><Trash2 size={13} /></button>
                                </div>
                            </div>

                            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 999, height: 8, overflow: 'hidden' }}>
                                <div className="progress-bar" style={{
                                    height: '100%', borderRadius: 999,
                                    background: over
                                        ? 'linear-gradient(90deg, #f43f5e, #ec4899)'
                                        : pct > 75
                                            ? 'linear-gradient(90deg, #f59e0b, #f97316)'
                                            : `linear-gradient(90deg, ${catColors[b.category] || '#4f46e5'}, #7c3aed)`,
                                    width: `${pct}%`,
                                    boxShadow: `0 0 8px ${color}66`,
                                }} />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
                                <span style={{ fontSize: 12, color: over ? '#f87171' : '#64748b' }}>
                                    {over ? `₹${(s - limit).toLocaleString()} over budget` : `₹${(limit - s).toLocaleString()} remaining`}
                                </span>
                                <span style={{ fontSize: 12, fontWeight: 600, color }}>{Math.round(pct)}%</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}