import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, TrendingUp } from 'lucide-react';
import api from '../api';
import toast from 'react-hot-toast';

const INCOME_CATEGORIES = [
    'Salary', 'Freelance', 'Business', 'Investment',
    'Rental', 'Gift', 'Bonus', 'Other'
];

const catColors = {
    Salary: '#4f46e5', Freelance: '#06b6d4', Business: '#10b981',
    Investment: '#f59e0b', Rental: '#ec4899', Gift: '#8b5cf6',
    Bonus: '#f43f5e', Other: '#64748b',
};

const catIcons = {
    Salary: '💼', Freelance: '💻', Business: '🏢',
    Investment: '📈', Rental: '🏠', Gift: '🎁',
    Bonus: '🎯', Other: '💰',
};

const empty = {
    description: '', amount: '', category: 'Salary',
    payee: '', expenseDate: '', type: 'INCOME', notes: ''
};

export default function Income() {
    const [income, setIncome] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(empty);
    const [editId, setEditId] = useState(null);

    const load = () => {
        api.get('/expenses')
            .then(r => {
                const data = Array.isArray(r.data) ? r.data : [];
                setIncome(data.filter(e => e.type === 'INCOME'));
            })
            .catch(() => setIncome([]));
    };

    useEffect(() => { load(); }, []);

    const totalIncome = income.reduce((s, e) => s + Number(e.amount), 0);

    const byCat = income.reduce((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
        return acc;
    }, {});

    const save = async e => {
        e.preventDefault();
        try {
            if (editId) {
                await api.put(`/expenses/${editId}`, { ...form, type: 'INCOME' });
                toast.success('Updated!');
            } else {
                await api.post('/expenses', { ...form, type: 'INCOME' });
                toast.success('Income added!');
            }
            setShowForm(false); setForm(empty); setEditId(null); load();
        } catch { toast.error('Something went wrong'); }
    };

    const del = async id => {
        if (!window.confirm('Delete this income entry?')) return;
        await api.delete(`/expenses/${id}`);
        toast.success('Deleted'); load();
    };

    const edit = entry => {
        setForm({ ...entry, amount: entry.amount.toString() });
        setEditId(entry.id);
        setShowForm(true);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e2e8f0' }}>Income</h1>
                    <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
                        {income.length} entries · Total: ₹{totalIncome.toLocaleString()}
                    </p>
                </div>
                <button onClick={() => { setShowForm(true); setForm(empty); setEditId(null); }}
                    style={{
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: 'white', border: 'none', borderRadius: 12,
                        padding: '10px 18px', fontSize: 14, fontWeight: 600,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                        boxShadow: '0 4px 15px rgba(16,185,129,0.3)',
                    }}>
                    <Plus size={16} /> Add income
                </button>
            </div>

            {/* Summary cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
                {Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([cat, amt]) => (
                    <div key={cat} style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: `1px solid ${catColors[cat] || '#64748b'}44`,
                        borderRadius: 14, padding: 18,
                        transition: 'all 0.2s ease',
                    }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                        <div style={{ fontSize: 22, marginBottom: 8 }}>{catIcons[cat] || '💰'}</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: '#10b981' }}>
                            ₹{Number(amt).toLocaleString()}
                        </div>
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{cat}</div>
                        <div style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>
                            {totalIncome > 0 ? Math.round((amt / totalIncome) * 100) : 0}% of total
                        </div>
                    </div>
                ))}
                {Object.keys(byCat).length === 0 && (
                    <div style={{
                        gridColumn: 'span 4', textAlign: 'center', padding: '32px',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 14,
                        color: '#475569', fontSize: 14,
                    }}>
                        No income entries yet
                    </div>
                )}
            </div>

            {/* Total bar */}
            <div style={{
                background: 'rgba(16,185,129,0.1)',
                border: '1px solid rgba(16,185,129,0.2)',
                borderRadius: 14, padding: '16px 20px',
                display: 'flex', alignItems: 'center', gap: 12,
            }}>
                <TrendingUp size={22} color="#10b981" />
                <div>
                    <div style={{ fontSize: 13, color: '#64748b' }}>Total income this month</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: '#10b981' }}>
                        ₹{totalIncome.toLocaleString()}
                    </div>
                </div>
            </div>

            {/* Add / Edit form */}
            {showForm && (
                <div style={{
                    background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(16,185,129,0.2)', borderRadius: 20, padding: 28,
                    animation: 'fadeInUp 0.3s ease',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <h3 style={{ fontSize: 17, fontWeight: 600, color: '#e2e8f0' }}>
                            {editId ? 'Edit income' : 'New income entry'}
                        </h3>
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
                                    Description
                                </label>
                                <input
                                    placeholder="e.g. Monthly salary, Freelance project"
                                    value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: '10px 14px', fontSize: 14 }}
                                />
                            </div>

                            <div>
                                <label style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500, display: 'block', marginBottom: 6 }}>
                                    Amount (₹)
                                </label>
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    value={form.amount}
                                    onChange={e => setForm({ ...form, amount: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: '10px 14px', fontSize: 14 }}
                                />
                            </div>

                            <div>
                                <label style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500, display: 'block', marginBottom: 6 }}>
                                    Category
                                </label>
                                <select value={form.category}
                                    onChange={e => setForm({ ...form, category: e.target.value })}
                                    style={{ width: '100%', padding: '10px 14px', fontSize: 14 }}>
                                    {INCOME_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                </select>
                            </div>

                            <div>
                                <label style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500, display: 'block', marginBottom: 6 }}>
                                    Source / Payer
                                </label>
                                <input
                                    placeholder="e.g. Company name, Client"
                                    value={form.payee}
                                    onChange={e => setForm({ ...form, payee: e.target.value })}
                                    style={{ width: '100%', padding: '10px 14px', fontSize: 14 }}
                                />
                            </div>

                            <div>
                                <label style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500, display: 'block', marginBottom: 6 }}>
                                    Date received
                                </label>
                                <input
                                    type="date"
                                    value={form.expenseDate}
                                    onChange={e => setForm({ ...form, expenseDate: e.target.value })}
                                    style={{ width: '100%', padding: '10px 14px', fontSize: 14 }}
                                />
                            </div>

                            <div>
                                <label style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500, display: 'block', marginBottom: 6 }}>
                                    Notes
                                </label>
                                <input
                                    placeholder="Optional note"
                                    value={form.notes}
                                    onChange={e => setForm({ ...form, notes: e.target.value })}
                                    style={{ width: '100%', padding: '10px 14px', fontSize: 14 }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                            <button type="submit" style={{
                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                color: 'white', border: 'none', borderRadius: 10,
                                padding: '11px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
                            }}>
                                {editId ? 'Update' : 'Add income'}
                            </button>
                            <button type="button" onClick={() => setShowForm(false)} style={{
                                background: 'rgba(255,255,255,0.05)', color: '#94a3b8',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: 10, padding: '11px 20px', fontSize: 14, cursor: 'pointer',
                            }}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Income table */}
            <div style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 16, overflow: 'hidden',
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            {['Description', 'Category', 'Amount', 'Date', 'Source', 'Actions'].map(h => (
                                <th key={h} style={{
                                    padding: '14px 18px', textAlign: 'left',
                                    fontSize: 11, fontWeight: 600, color: '#64748b',
                                    letterSpacing: '0.06em', textTransform: 'uppercase',
                                }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {income.map((e, i) => (
                            <tr key={e.id} style={{
                                borderBottom: '1px solid rgba(255,255,255,0.04)',
                                background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                                transition: 'background 0.15s',
                            }}
                                onMouseEnter={el => el.currentTarget.style.background = 'rgba(16,185,129,0.05)'}
                                onMouseLeave={el => el.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'}>
                                <td style={{ padding: '14px 18px' }}>
                                    <div style={{ fontSize: 14, fontWeight: 500, color: '#e2e8f0' }}>{e.description}</div>
                                    {e.notes && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{e.notes}</div>}
                                </td>
                                <td style={{ padding: '14px 18px' }}>
                                    <span style={{
                                        background: `${catColors[e.category] || '#64748b'}22`,
                                        color: catColors[e.category] || '#94a3b8',
                                        border: `1px solid ${catColors[e.category] || '#64748b'}44`,
                                        borderRadius: 8, padding: '3px 10px', fontSize: 12, fontWeight: 500,
                                        display: 'inline-flex', alignItems: 'center', gap: 4,
                                    }}>
                                        {catIcons[e.category] || '💰'} {e.category}
                                    </span>
                                </td>
                                <td style={{ padding: '14px 18px' }}>
                                    <span style={{ fontSize: 15, fontWeight: 700, color: '#10b981' }}>
                                        +₹{Number(e.amount).toLocaleString()}
                                    </span>
                                </td>
                                <td style={{ padding: '14px 18px', fontSize: 13, color: '#94a3b8' }}>
                                    {e.expenseDate}
                                </td>
                                <td style={{ padding: '14px 18px', fontSize: 13, color: '#94a3b8' }}>
                                    {e.payee || '—'}
                                </td>
                                <td style={{ padding: '14px 18px' }}>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <button onClick={() => edit(e)} style={{
                                            background: 'rgba(79,70,229,0.15)', border: '1px solid rgba(79,70,229,0.3)',
                                            borderRadius: 8, padding: '6px 8px', cursor: 'pointer', color: '#a78bfa',
                                        }}><Pencil size={13} /></button>
                                        <button onClick={() => del(e.id)} style={{
                                            background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.3)',
                                            borderRadius: 8, padding: '6px 8px', cursor: 'pointer', color: '#f87171',
                                        }}><Trash2 size={13} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {income.length === 0 && (
                            <tr><td colSpan={6} style={{
                                textAlign: 'center', padding: '48px', color: '#475569', fontSize: 14,
                            }}>
                                No income entries yet — add your first one!
                            </td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}