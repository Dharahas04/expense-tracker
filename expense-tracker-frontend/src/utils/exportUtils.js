import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatAmount = (amount) => {
    return `Rs.${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
};

// ── CSV EXPORT ────────────────────────────────────────────────────────────
export const exportToCSV = (expenses, filename = 'expenses') => {
    const headers = ['Date', 'Description', 'Category', 'Payee', 'Type', 'Amount'];

    const rows = expenses.map(e => [
        e.expenseDate || '',
        `"${(e.description || '').replace(/"/g, '""')}"`,
        e.category || '',
        `"${(e.payee || '').replace(/"/g, '""')}"`,
        e.type || '',
        Number(e.amount).toFixed(2),
    ]);

    const totalExpenses = expenses
        .filter(e => e.type === 'EXPENSE')
        .reduce((s, e) => s + Number(e.amount), 0);

    const totalIncome = expenses
        .filter(e => e.type === 'INCOME')
        .reduce((s, e) => s + Number(e.amount), 0);

    const csvContent = [
        headers.join(','),
        ...rows.map(r => r.join(',')),
        '',
        `Total Expenses,${totalExpenses.toFixed(2)}`,
        `Total Income,${totalIncome.toFixed(2)}`,
        `Net Balance,${(totalIncome - totalExpenses).toFixed(2)}`,
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
};

// ── PDF EXPORT ────────────────────────────────────────────────────────────
export const exportToPDF = (expenses, budgets = [], userName = 'User') => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const now = new Date();
    const monthYear = now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

    // ── HEADER ──
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, pageW, 42, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('Expense Report', 14, 16);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`${monthYear}  |  ${userName}`, 14, 26);
    doc.text(`Generated: ${formatDate(now.toISOString())}`, 14, 34);

    // ── SUMMARY BOXES ──
    const totalExpenses = expenses
        .filter(e => e.type === 'EXPENSE')
        .reduce((s, e) => s + Number(e.amount), 0);
    const totalIncome = expenses
        .filter(e => e.type === 'INCOME')
        .reduce((s, e) => s + Number(e.amount), 0);
    const netBalance = totalIncome - totalExpenses;

    const summaryY = 52;
    const boxW = 56;
    const boxes = [
        { label: 'Total Expenses', value: formatAmount(totalExpenses), color: [239, 68, 68] },
        { label: 'Total Income', value: formatAmount(totalIncome), color: [16, 185, 129] },
        {
            label: 'Net Balance', value: formatAmount(Math.abs(netBalance)),
            color: netBalance >= 0 ? [16, 185, 129] : [239, 68, 68]
        },
    ];

    boxes.forEach((box, i) => {
        const x = 14 + i * (boxW + 6);
        doc.setFillColor(248, 248, 255);
        doc.roundedRect(x, summaryY, boxW, 22, 3, 3, 'F');
        doc.setDrawColor(...box.color);
        doc.setLineWidth(0.8);
        doc.roundedRect(x, summaryY, boxW, 22, 3, 3, 'S');

        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.setFont('helvetica', 'normal');
        doc.text(box.label, x + 4, summaryY + 7);

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...box.color);
        doc.text(box.value, x + 4, summaryY + 16);
    });

    // ── CATEGORY BREAKDOWN ──
    const catY = summaryY + 32;
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 60);
    doc.text('Spending by category', 14, catY);

    const catMap = {};
    expenses.filter(e => e.type === 'EXPENSE').forEach(e => {
        catMap[e.category] = (catMap[e.category] || 0) + Number(e.amount);
    });
    const catData = Object.entries(catMap)
        .sort((a, b) => b[1] - a[1])
        .map(([cat, amt]) => [
            cat,
            formatAmount(amt),
            totalExpenses > 0 ? `${Math.round((amt / totalExpenses) * 100)}%` : '0%',
        ]);

    autoTable(doc, {
        startY: catY + 4,
        head: [['Category', 'Amount', 'Share']],
        body: catData,
        theme: 'grid',
        headStyles: {
            fillColor: [79, 70, 229],
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 9,
        },
        bodyStyles: { fontSize: 9, textColor: [30, 30, 60] },
        alternateRowStyles: { fillColor: [245, 245, 255] },
        columnStyles: {
            0: { cellWidth: 60 },
            1: { cellWidth: 50, halign: 'right' },
            2: { cellWidth: 30, halign: 'center' },
        },
        margin: { left: 14, right: 14 },
    });

    // ── BUDGET STATUS ──
    if (budgets.length > 0) {
        const budgetY = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 30, 60);
        doc.text('Budget status', 14, budgetY);

        const budgetData = budgets.map(b => {
            const s = catMap[b.category] || 0;
            const limit = Number(b.limitAmount);
            const pct = Math.round((s / limit) * 100);
            const status = s > limit ? 'OVER' : pct > 75 ? 'WARNING' : 'OK';
            return [b.category, formatAmount(limit), formatAmount(s), `${pct}%`, status];
        });

        autoTable(doc, {
            startY: budgetY + 4,
            head: [['Category', 'Budget', 'Spent', 'Used', 'Status']],
            body: budgetData,
            theme: 'grid',
            headStyles: {
                fillColor: [79, 70, 229],
                textColor: 255,
                fontStyle: 'bold',
                fontSize: 9,
            },
            bodyStyles: { fontSize: 9, textColor: [30, 30, 60] },
            alternateRowStyles: { fillColor: [245, 245, 255] },
            didDrawCell: (data) => {
                if (data.column.index === 4 && data.section === 'body') {
                    const val = data.cell.raw;
                    if (val === 'OVER') doc.setTextColor(239, 68, 68);
                    else if (val === 'WARNING') doc.setTextColor(245, 158, 11);
                    else doc.setTextColor(16, 185, 129);
                }
            },
            margin: { left: 14, right: 14 },
        });
    }

    // ── TRANSACTIONS TABLE ──
    const txY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 60);
    doc.text('All transactions', 14, txY);

    const txData = expenses.map(e => [
        formatDate(e.expenseDate),
        e.description || '—',
        e.category || '—',
        e.payee || '—',
        e.type,
        formatAmount(e.amount),
    ]);

    autoTable(doc, {
        startY: txY + 4,
        head: [['Date', 'Description', 'Category', 'Payee', 'Type', 'Amount']],
        body: txData,
        theme: 'striped',
        headStyles: {
            fillColor: [79, 70, 229],
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 8,
        },
        bodyStyles: { fontSize: 8, textColor: [30, 30, 60] },
        alternateRowStyles: { fillColor: [245, 245, 255] },
        didDrawCell: (data) => {
            if (data.column.index === 4 && data.section === 'body') {
                const val = data.cell.raw;
                if (val === 'INCOME') doc.setTextColor(16, 185, 129);
                else doc.setTextColor(239, 68, 68);
            }
            if (data.column.index === 5 && data.section === 'body') {
                const row = expenses[data.row.index];
                if (row?.type === 'INCOME') doc.setTextColor(16, 185, 129);
                else doc.setTextColor(239, 68, 68);
            }
        },
        columnStyles: {
            0: { cellWidth: 24 },
            1: { cellWidth: 48 },
            2: { cellWidth: 28 },
            3: { cellWidth: 28 },
            4: { cellWidth: 20, halign: 'center' },
            5: { cellWidth: 30, halign: 'right' },
        },
        margin: { left: 14, right: 14 },
    });

    // ── FOOTER ──
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.setFont('helvetica', 'normal');
        doc.text(
            `Page ${i} of ${pageCount}  |  ExpenseTracker Report  |  ${monthYear}`,
            pageW / 2, doc.internal.pageSize.getHeight() - 8,
            { align: 'center' }
        );
    }

    doc.save(`expense_report_${now.toISOString().split('T')[0]}.pdf`);
};