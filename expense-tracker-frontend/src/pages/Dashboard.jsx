import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { TrendingUp, TrendingDown, Wallet, ArrowUpDown } from 'lucide-react';
import api from '../api';

const COLORS = ['#4f46e5', '#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e', '#ec4899'];

const StatCard = ({ label, value, icon: Icon, color, sub, subColor }) => (
    <div style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 16, padding: 24,
        display: 'flex', flexDirection: 'column', gap: 12,
        transition: 'all 0.2s ease', cursor: 'default',
    }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = `${color}44`; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}>
        <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: `${color}22`, border: `1px solid ${color}44`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
            <Icon size={20} color={color} />
        </div>
        <div>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>{value}</div>
            <div style={{ fontSize: 13, color: '#64748b' }}>{label}</div>
            {sub && <div style={{ fontSize: 12, color: subColor || '#10b981', marginTop: 4 }}>{sub}</div>}
        </div>
    </div>
);

const buildMonthlyData = (expenses) => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
            month: d.toLocaleString('default', { month: 'short' }),
            year: d.getFullYear(),
            monthNum: d.getMonth(),
            expenses: 0,
            income: 0,
        });
    }
    expenses.forEach(e => {
        if (!e.expenseDate) return;
        const d = new Date(e.expenseDate);
        const idx = months.findIndex(
            m => m.monthNum === d.getMonth() && m.year === d.getFullYear()
        );
        if (idx === -1) return;
        if (e.type === 'EXPENSE') months[idx].expenses += Number(e.amount);
        else if (e.type === 'INCOME') months[idx].income += Number(e.amount);
    });
    return months;
};

export default function Dashboard() {
    const [allExpenses, setAllExpenses] = useState([]);
    const [summary, setSummary] = useState(null);

    useEffect(() => {
        api.get('/expenses/summary').then(r => setSummary(r.data)).catch(() => setSummary(null));
        api.get('/expenses').then(r => {
            const data = Array.isArray(r.data) ? r.data : [];
            setAllExpenses(data);
        }).catch(() => setAllExpenses([]));
    }, []);

    const recent = allExpenses.slice(0, 6);
    const monthlyData = buildMonthlyData(allExpenses);
    const pieData = summary?.byCategory?.map(([cat, val]) => ({ name: cat, value: Number(val) })) || [];

    const totalExpenses = allExpenses.filter(e => e.type === 'EXPENSE').reduce((s, e) => s + Number(e.amount), 0);
    const totalIncome = allExpenses.filter(e => e.type === 'INCOME').reduce((s, e) => s + Number(e.amount), 0);
    const netBalance = totalIncome - totalExpenses;

    const categoryIcons = {
        Food: '🍔', Transport: '🚗', Shopping: '🛍️', Health: '💊',
        Entertainment: '🎬', Utilities: '⚡', Rent: '🏠', Other: '💸',
        Salary: '💼', Freelance: '💻', Business: '🏢', Investment: '📈',
    };

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
    const firstName = (localStorage.getItem('name') || 'User').split(' ')[0];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

            {/* Header */}
            <div>
                <h1 style={{ fontSize: 28, fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>
                    Good {greeting}, {firstName} 👋
                </h1>
                <p style={{ color: '#64748b', fontSize: 14 }}>Here's your financial overview.</p>
            </div>

            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
                <StatCard label="Total expenses" value={`₹${totalExpenses.toLocaleString()}`}
                    icon={TrendingDown} color="#f43f5e" sub="All time" subColor="#f87171" />
                <StatCard label="Total income" value={`₹${totalIncome.toLocaleString()}`}
                    icon={TrendingUp} color="#10b981" sub="All time" subColor="#10b981" />
                <StatCard label="Net balance" value={`₹${Math.abs(netBalance).toLocaleString()}`}
                    icon={ArrowUpDown}
                    color={netBalance >= 0 ? '#10b981' : '#f43f5e'}
                    sub={netBalance >= 0 ? 'Surplus' : 'Deficit'}
                    subColor={netBalance >= 0 ? '#10b981' : '#f87171'} />
                <StatCard label="Transactions" value={allExpenses.length}
                    icon={Wallet} color="#4f46e5" sub={`${pieData.length} categories`} subColor="#a78bfa" />
            </div>

            {/* Monthly bar chart */}
            <div style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 16, padding: 24,
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0' }}>6-month spending trend</h3>
                    <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 10, height: 10, borderRadius: 2, background: '#f43f5e' }} />
                            <span style={{ color: '#94a3b8' }}>Expenses</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 10, height: 10, borderRadius: 2, background: '#10b981' }} />
                            <span style={{ color: '#94a3b8' }}>Income</span>
                        </div>
                    </div>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={monthlyData} barCategoryGap="30%" barGap={4}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false}
                            tickFormatter={v => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                        <Tooltip
                            contentStyle={{ background: '#1e1e3a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#e2e8f0' }}
                            formatter={(v, name) => [`₹${Number(v).toLocaleString()}`, name === 'expenses' ? 'Expenses' : 'Income']}
                            labelStyle={{ color: '#94a3b8', marginBottom: 4 }}
                        />
                        <Bar dataKey="expenses" fill="#f43f5e" radius={[6, 6, 0, 0]} fillOpacity={0.85} />
                        <Bar dataKey="income" fill="#10b981" radius={[6, 6, 0, 0]} fillOpacity={0.85} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Pie + Recent */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

                {/* Pie chart */}
                <div style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 16, padding: 24,
                }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 20 }}>Spending by category</h3>
                    {pieData.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: '#475569' }}>No expenses yet</div>
                    ) : (
                        <>
                            <ResponsiveContainer width="100%" height={180}>
                                <PieChart>
                                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                                        dataKey="value" paddingAngle={3}>
                                        {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ background: '#1e1e3a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#e2e8f0' }}
                                        formatter={v => [`₹${Number(v).toLocaleString()}`, '']}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px', marginTop: 8 }}>
                                {pieData.map((item, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
                                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                                        <span style={{ color: '#94a3b8' }}>{item.name}</span>
                                        <span style={{ color: '#64748b' }}>₹{Number(item.value).toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Recent transactions */}
                <div style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 16, padding: 24,
                }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 20 }}>Recent transactions</h3>
                    {recent.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: '#475569' }}>No transactions yet</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {recent.map(e => (
                                <div key={e.id} style={{
                                    display: 'flex', alignItems: 'center', gap: 12,
                                    padding: '10px 12px', borderRadius: 12,
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                }}>
                                    <div style={{
                                        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                                        background: e.type === 'INCOME' ? 'rgba(16,185,129,0.15)' : 'rgba(248,113,113,0.1)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                                    }}>
                                        {categoryIcons[e.category] || '💸'}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 13, fontWeight: 500, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {e.description}
                                        </div>
                                        <div style={{ fontSize: 11, color: '#64748b' }}>{e.category} · {e.expenseDate}</div>
                                    </div>
                                    <div style={{
                                        fontSize: 14, fontWeight: 600, flexShrink: 0,
                                        color: e.type === 'INCOME' ? '#10b981' : '#f87171',
                                    }}>
                                        {e.type === 'INCOME' ? '+' : '-'}₹{Number(e.amount).toLocaleString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Net balance summary bar */}
            <div style={{
                background: netBalance >= 0 ? 'rgba(16,185,129,0.08)' : 'rgba(244,63,94,0.08)',
                border: `1px solid ${netBalance >= 0 ? 'rgba(16,185,129,0.2)' : 'rgba(244,63,94,0.2)'}`,
                borderRadius: 14, padding: '18px 24px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                        width: 44, height: 44, borderRadius: 12,
                        background: netBalance >= 0 ? 'rgba(16,185,129,0.2)' : 'rgba(244,63,94,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <ArrowUpDown size={20} color={netBalance >= 0 ? '#10b981' : '#f43f5e'} />
                    </div>
                    <div>
                        <div style={{ fontSize: 13, color: '#64748b' }}>Net balance (income − expenses)</div>
                        <div style={{ fontSize: 22, fontWeight: 700, color: netBalance >= 0 ? '#10b981' : '#f43f5e', marginTop: 2 }}>
                            {netBalance >= 0 ? '+' : '-'}₹{Math.abs(netBalance).toLocaleString()}
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 24, fontSize: 13 }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ color: '#64748b', marginBottom: 2 }}>Income</div>
                        <div style={{ fontWeight: 600, color: '#10b981' }}>₹{totalIncome.toLocaleString()}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ color: '#64748b', marginBottom: 2 }}>Expenses</div>
                        <div style={{ fontWeight: 600, color: '#f87171' }}>₹{totalExpenses.toLocaleString()}</div>
                    </div>
                </div>
            </div>

        </div>
    );
}