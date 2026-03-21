import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Search, Camera, Download, FileText } from 'lucide-react';
import api from '../api';
import toast from 'react-hot-toast';
import ReceiptScanner from '../components/ReceiptScanner';
import { exportToPDF, exportToCSV } from '../utils/exportUtils';


const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Health', 'Entertainment', 'Utilities', 'Rent', 'Other'];
const empty = { description: '', amount: '', category: 'Food', payee: '', expenseDate: '', type: 'EXPENSE', notes: '' };

const catColors = {
    Food: '#f59e0b', Transport: '#06b6d4', Shopping: '#ec4899',
    Health: '#10b981', Entertainment: '#f43f5e', Utilities: '#8b5cf6',
    Rent: '#4f46e5', Other: '#64748b',
};

export default function Expenses() {
    const [expenses, setExpenses] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(empty);
    const [editId, setEditId] = useState(null);
    const [search, setSearch] = useState('');
    const [showScanner, setShowScanner] = useState(false);
    const [filterMonth, setFilterMonth] = useState('');
    const [filterType, setFilterType] = useState('ALL');

    const load = () => {
        api.get('/expenses')
            .then(r => {
                const data = r.data;
                if (Array.isArray(data)) {
                    setExpenses(data);
                } else {
                    console.warn('Expenses API did not return array:', data);
                    setExpenses([]);
                }
            })
            .catch(err => {
                console.error('Failed to load expenses:', err);
                setExpenses([]);
            });
    };

    useEffect(() => { load(); }, []);

    const save = async e => {
        e.preventDefault();
        try {
            if (editId) { await api.put(`/expenses/${editId}`, form); toast.success('Updated!'); }
            else { await api.post('/expenses', form); toast.success('Expense added!'); }
            setShowForm(false); setForm(empty); setEditId(null); load();
        } catch { toast.error('Something went wrong'); }
    };

    const del = async id => {
        if (!window.confirm('Delete this expense?')) return;
        await api.delete(`/expenses/${id}`);
        toast.success('Deleted'); load();
    };

    const edit = ex => {
        setForm({ ...ex, amount: ex.amount.toString() });
        setEditId(ex.id); setShowForm(true);
    };

    const handleScannedData = (data) => {
        setForm({
            description: data.description || '',
            amount: data.amount || '',
            category: data.category || 'Food',
            payee: data.payee || '',
            expenseDate: data.date || '',
            type: 'EXPENSE',
            notes: 'Added via receipt scan',
        });
        setEditId(null);
        setShowForm(true);
    };

    const filtered = Array.isArray(expenses) ? expenses.filter(e => {
        const matchSearch =
            (e.description || '').toLowerCase().includes(search.toLowerCase()) ||
            (e.category || '').toLowerCase().includes(search.toLowerCase());

        const matchMonth = filterMonth
            ? (e.expenseDate || '').startsWith(filterMonth)
            : true;

        const matchType = filterType === 'ALL' ? true : e.type === filterType;

        return matchSearch && matchMonth && matchType;
    }) : [];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e2e8f0' }}>Expenses</h1>
                    <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{expenses.length} total transactions</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => setShowScanner(true)}
                        style={{
                            background: 'rgba(16,185,129,0.15)', color: '#10b981',
                            border: '1px solid rgba(16,185,129,0.3)', borderRadius: 12,
                            padding: '10px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 8,
                        }}>
                        <Camera size={16} /> Scan receipt
                    </button>
                    <button onClick={() => { setShowForm(true); setForm(empty); setEditId(null); }}
                        style={{
                            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                            color: 'white', border: 'none', borderRadius: 12,
                            padding: '10px 18px', fontSize: 14, fontWeight: 600,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                            boxShadow: '0 4px 15px rgba(79,70,229,0.3)',
                        }}>
                        <Plus size={16} /> Add expense
                    </button>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => exportToCSV(expenses)}
                        style={{
                            background: 'rgba(16,185,129,0.15)', color: '#10b981',
                            border: '1px solid rgba(16,185,129,0.3)', borderRadius: 12,
                            padding: '10px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 8,
                        }}>
                        <FileText size={16} /> CSV
                    </button>
                    <button onClick={() => exportToPDF(expenses, [], localStorage.getItem('name') || 'User')}
                        style={{
                            background: 'rgba(124,58,237,0.15)', color: '#a78bfa',
                            border: '1px solid rgba(124,58,237,0.3)', borderRadius: 12,
                            padding: '10px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 8,
                        }}>
                        <Download size={16} /> PDF
                    </button>
                    <button onClick={() => setShowScanner(true)}
                        style={{
                            background: 'rgba(6,182,212,0.15)', color: '#06b6d4',
                            border: '1px solid rgba(6,182,212,0.3)', borderRadius: 12,
                            padding: '10px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 8,
                        }}>
                        <Camera size={16} /> Scan receipt
                    </button>
                    <button onClick={() => { setShowForm(true); setForm(empty); setEditId(null); }}
                        style={{
                            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                            color: 'white', border: 'none', borderRadius: 12,
                            padding: '10px 18px', fontSize: 14, fontWeight: 600,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                            boxShadow: '0 4px 15px rgba(79,70,229,0.3)',
                        }}>
                        <Plus size={16} /> Add expense
                    </button>
                </div>
            </div>

            {/* Search */}
            {/* Filter bar */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 2, minWidth: 200 }}>
                    <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                    <input
                        placeholder="Search expenses..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ width: '100%', padding: '11px 14px 11px 42px', fontSize: 14, borderRadius: 12 }}
                    />
                </div>

                <div style={{ position: 'relative', flex: 1, minWidth: 160 }}>
                    <input
                        type="month"
                        value={filterMonth}
                        onChange={e => setFilterMonth(e.target.value)}
                        style={{ width: '100%', padding: '11px 14px', fontSize: 14, borderRadius: 12 }}
                    />
                </div>

                <select value={filterType} onChange={e => setFilterType(e.target.value)}
                    style={{ padding: '11px 16px', fontSize: 14, borderRadius: 12, minWidth: 130 }}>
                    <option value="ALL">All types</option>
                    <option value="EXPENSE">Expenses only</option>
                    <option value="INCOME">Income only</option>
                </select>

                {(filterMonth || filterType !== 'ALL' || search) && (
                    <button onClick={() => { setSearch(''); setFilterMonth(''); setFilterType('ALL'); }}
                        style={{
                            background: 'rgba(248,113,113,0.15)', color: '#f87171',
                            border: '1px solid rgba(248,113,113,0.3)', borderRadius: 12,
                            padding: '11px 16px', fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
                        }}>
                        Clear filters
                    </button>
                )}
            </div>

            {/* Filter summary */}
            {(filterMonth || filterType !== 'ALL') && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 8, fontSize: 12,
                    color: '#94a3b8', padding: '8px 14px',
                    background: 'rgba(79,70,229,0.08)',
                    border: '1px solid rgba(79,70,229,0.2)',
                    borderRadius: 10,
                }}>
                    <span>Showing {filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
                    {filterMonth && <span>· {new Date(filterMonth + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}</span>}
                    {filterType !== 'ALL' && <span>· {filterType === 'EXPENSE' ? 'Expenses only' : 'Income only'}</span>}
                    <span style={{ marginLeft: 'auto', color: '#4f46e5', fontWeight: 600 }}>
                        Total: ₹{filtered.reduce((s, e) => s + Number(e.amount), 0).toLocaleString()}
                    </span>
                </div>
            )}

            {/* Form */}
            {showForm && (
                <div style={{
                    background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 28,
                    animation: 'fadeInUp 0.3s ease',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <h3 style={{ fontSize: 17, fontWeight: 600, color: '#e2e8f0' }}>
                            {editId ? 'Edit expense' : 'New expense'}
                        </h3>
                        <button onClick={() => setShowForm(false)} style={{
                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 8, padding: '6px 8px', cursor: 'pointer', color: '#94a3b8',
                        }}>
                            <X size={16} />
                        </button>
                    </div>
                    <form onSubmit={save}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                            {[
                                { name: 'description', label: 'Description', type: 'text', full: true, placeholder: 'e.g. Lunch at Swiggy' },
                                { name: 'amount', label: 'Amount (₹)', type: 'number', placeholder: '0.00' },
                                { name: 'payee', label: 'Payee', type: 'text', placeholder: 'Merchant name' },
                                { name: 'expenseDate', label: 'Date', type: 'date' },
                                { name: 'notes', label: 'Notes', type: 'text', full: true, placeholder: 'Optional note' },
                            ].map(f => (
                                <div key={f.name} style={{ gridColumn: f.full ? 'span 2' : 'span 1' }}>
                                    <label style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500, display: 'block', marginBottom: 6 }}>{f.label}</label>
                                    <input type={f.type} placeholder={f.placeholder} value={form[f.name]}
                                        onChange={e => setForm({ ...form, [f.name]: e.target.value })}
                                        required={['description', 'amount'].includes(f.name)}
                                        style={{ width: '100%', padding: '10px 14px', fontSize: 14 }}
                                    />
                                </div>
                            ))}
                            <div>
                                <label style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500, display: 'block', marginBottom: 6 }}>Category</label>
                                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                                    style={{ width: '100%', padding: '10px 14px', fontSize: 14 }}>
                                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500, display: 'block', marginBottom: 6 }}>Type</label>
                                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                                    style={{ width: '100%', padding: '10px 14px', fontSize: 14 }}>
                                    <option value="EXPENSE">Expense</option>
                                    <option value="INCOME">Income</option>
                                </select>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                            <button type="submit" style={{
                                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                                color: 'white', border: 'none', borderRadius: 10,
                                padding: '11px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                            }}>
                                {editId ? 'Update' : 'Add expense'}
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

            {/* Table */}
            <div style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 16, overflow: 'hidden',
            }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                {['Description', 'Category', 'Amount', 'Date', 'Type', 'Actions'].map(h => (
                                    <th key={h} style={{
                                        padding: '14px 18px', textAlign: 'left',
                                        fontSize: 11, fontWeight: 600, color: '#64748b',
                                        letterSpacing: '0.06em', textTransform: 'uppercase',
                                    }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((e, i) => (
                                <tr key={e.id} style={{
                                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                                    transition: 'background 0.15s',
                                    background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                                }}
                                    onMouseEnter={el => el.currentTarget.style.background = 'rgba(79,70,229,0.06)'}
                                    onMouseLeave={el => el.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'}>
                                    <td style={{ padding: '14px 18px' }}>
                                        <div style={{ fontSize: 14, fontWeight: 500, color: '#e2e8f0' }}>{e.description}</div>
                                        {e.payee && <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{e.payee}</div>}
                                    </td>
                                    <td style={{ padding: '14px 18px' }}>
                                        <span style={{
                                            background: `${catColors[e.category] || '#64748b'}22`,
                                            color: catColors[e.category] || '#94a3b8',
                                            border: `1px solid ${catColors[e.category] || '#64748b'}44`,
                                            borderRadius: 8, padding: '3px 10px', fontSize: 12, fontWeight: 500,
                                        }}>{e.category}</span>
                                    </td>
                                    <td style={{ padding: '14px 18px' }}>
                                        <span style={{
                                            fontSize: 15, fontWeight: 600,
                                            color: e.type === 'INCOME' ? '#10b981' : '#f87171',
                                        }}>
                                            {e.type === 'INCOME' ? '+' : '-'}₹{Number(e.amount).toLocaleString()}
                                        </span>
                                    </td>
                                    <td style={{ padding: '14px 18px', fontSize: 13, color: '#94a3b8' }}>{e.expenseDate}</td>
                                    <td style={{ padding: '14px 18px' }}>
                                        <span style={{
                                            background: e.type === 'INCOME' ? 'rgba(16,185,129,0.15)' : 'rgba(248,113,113,0.15)',
                                            color: e.type === 'INCOME' ? '#10b981' : '#f87171',
                                            border: `1px solid ${e.type === 'INCOME' ? 'rgba(16,185,129,0.3)' : 'rgba(248,113,113,0.3)'}`,
                                            borderRadius: 8, padding: '3px 10px', fontSize: 11, fontWeight: 600,
                                        }}>{e.type}</span>
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
                            {filtered.length === 0 && (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '48px', color: '#475569', fontSize: 14 }}>
                                    {search ? 'No results found' : 'No expenses yet — add your first one!'}
                                </td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Scanner modal */}
            {showScanner && (
                <ReceiptScanner
                    onDataExtracted={handleScannedData}
                    onClose={() => setShowScanner(false)}
                />
            )}
        </div>
    );
}