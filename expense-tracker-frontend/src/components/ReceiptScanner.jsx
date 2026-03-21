import { useState, useRef } from 'react';
import { createWorker } from 'tesseract.js';
import { Camera, Upload, X, Loader, CheckCircle, AlertCircle } from 'lucide-react';

// const parseReceiptText = (text) => {
//     const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
//     const result = { amount: '', description: '', payee: '', category: 'Food', date: '' };

//     // Extract amount — find largest number that looks like a price
//     const amountPatterns = [
//         /(?:total|grand total|amount|bill|net amount|to pay)[^\d]*(\d+[.,]\d{2})/i,
//         /(?:rs\.?|inr|₹)\s*(\d+(?:[.,]\d+)?)/i,
//         /(\d+[.,]\d{2})\s*(?:total|only)/i,
//     ];
//     for (const pattern of amountPatterns) {
//         const match = text.match(pattern);
//         if (match) {
//             result.amount = match[1].replace(',', '.');
//             break;
//         }
//     }
//     // Fallback — find all numbers and pick largest
//     if (!result.amount) {
//         const numbers = text.match(/\d+\.\d{2}/g) || [];
//         if (numbers.length > 0) {
//             result.amount = String(Math.max(...numbers.map(Number)));
//         }
//     }

//     // Extract date
//     const datePatterns = [
//         /(\d{2}[-\/]\d{2}[-\/]\d{4})/,
//         /(\d{4}[-\/]\d{2}[-\/]\d{2})/,
//         /(\d{2}[-\/]\d{2}[-\/]\d{2})/,
//     ];
//     for (const pattern of datePatterns) {
//         const match = text.match(pattern);
//         if (match) {
//             try {
//                 const parts = match[1].split(/[-\/]/);
//                 let dateObj;
//                 if (parts[0].length === 4) {
//                     dateObj = new Date(`${parts[0]}-${parts[1]}-${parts[2]}`);
//                 } else if (parts[2].length === 4) {
//                     dateObj = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
//                 } else {
//                     dateObj = new Date(`20${parts[2]}-${parts[1]}-${parts[0]}`);
//                 }
//                 if (!isNaN(dateObj)) {
//                     result.date = dateObj.toISOString().split('T')[0];
//                 }
//             } catch { }
//             break;
//         }
//     }

//     // Extract merchant / payee from first few lines
//     const skipWords = ['receipt', 'invoice', 'bill', 'tax', 'gst', 'date', 'time', 'order', 'table'];
//     for (const line of lines.slice(0, 6)) {
//         if (line.length > 3 && line.length < 40 && isNaN(line) &&
//             !skipWords.some(w => line.toLowerCase().includes(w))) {
//             result.payee = line;
//             break;
//         }
//     }

//     // Auto-detect category from keywords
//     const lower = text.toLowerCase();
//     if (/restaurant|cafe|food|pizza|burger|swiggy|zomato|hotel|dhaba|biryani|coffee/.test(lower))
//         result.category = 'Food';
//     else if (/uber|ola|petrol|fuel|metro|bus|auto|taxi|transport|parking/.test(lower))
//         result.category = 'Transport';
//     else if (/amazon|flipkart|mall|shop|store|mart|retail|fashion|cloth/.test(lower))
//         result.category = 'Shopping';
//     else if (/hospital|pharmacy|medical|doctor|clinic|health|medicine/.test(lower))
//         result.category = 'Health';
//     else if (/movie|cinema|pvr|inox|netflix|entertainment|event|concert/.test(lower))
//         result.category = 'Entertainment';
//     else if (/electricity|water|gas|internet|broadband|utility|bill/.test(lower))
//         result.category = 'Utilities';
//     else if (/rent|house|apartment|flat|lease/.test(lower))
//         result.category = 'Rent';

//     // Description from merchant or category
//     result.description = result.payee
//         ? `${result.category} at ${result.payee}`
//         : `${result.category} expense`;

//     return result;
// };
const parseReceiptText = (text) => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const result = { amount: '', description: '', payee: '', category: 'Food', date: '' };

    console.log('=== OCR RAW TEXT ===\n', text);

    // ── AMOUNT ──────────────────────────────────────────────────────────────
    // Strategy 1: Look for TOTAL label — highest priority
    const totalPatterns = [
        /\bTOTAL\b[^\d₹Rs\n]*[₹Rs]?\s*([\d,]+(?:\.\d{1,2})?)/i,
        /\bGRAND\s*TOTAL\b[^\d₹Rs\n]*[₹Rs]?\s*([\d,]+(?:\.\d{1,2})?)/i,
        /\bNET\s*(?:TOTAL|AMOUNT)\b[^\d₹Rs\n]*[₹Rs]?\s*([\d,]+(?:\.\d{1,2})?)/i,
        /\bAMOUNT\s*(?:DUE|PAYABLE)\b[^\d₹Rs\n]*[₹Rs]?\s*([\d,]+(?:\.\d{1,2})?)/i,
        /\bTO\s*PAY\b[^\d₹Rs\n]*[₹Rs]?\s*([\d,]+(?:\.\d{1,2})?)/i,
        /\bBILL\s*AMOUNT\b[^\d₹Rs\n]*[₹Rs]?\s*([\d,]+(?:\.\d{1,2})?)/i,
    ];

    for (const pat of totalPatterns) {
        const m = text.match(pat);
        if (m) {
            result.amount = parseFloat(m[1].replace(/,/g, '')).toFixed(2);
            console.log('Amount found via total label:', result.amount);
            break;
        }
    }

    // Strategy 2: Find the line that contains TOTAL and grab the number after it
    if (!result.amount) {
        for (const line of lines) {
            if (/\bTOTAL\b/i.test(line) && !/SUBTOTAL|SUB-TOTAL/i.test(line)) {
                const nums = line.match(/([\d,]+(?:\.\d{1,2})?)/g);
                if (nums) {
                    const candidates = nums
                        .map(n => parseFloat(n.replace(/,/g, '')))
                        .filter(n => n >= 10 && n < 10000000 && !/^9\d{9}$/.test(String(n)));
                    if (candidates.length > 0) {
                        result.amount = Math.max(...candidates).toFixed(2);
                        console.log('Amount found on TOTAL line:', result.amount);
                        break;
                    }
                }
            }
        }
    }

    // Strategy 3: Look at last 6 lines, find biggest number
    // (totals appear at the bottom, phone numbers appear at top)
    if (!result.amount) {
        const lastLines = lines.slice(-6);
        const candidates = [];
        for (const line of lastLines) {
            const nums = line.match(/([\d,]+(?:\.\d{1,2})?)/g) || [];
            for (const n of nums) {
                const val = parseFloat(n.replace(/,/g, ''));
                // Exclude phone numbers (10 digits starting with 6-9)
                if (val >= 10 && val < 10000000 && !/^[6-9]\d{9}$/.test(n.replace(/,/g, ''))) {
                    candidates.push(val);
                }
            }
        }
        if (candidates.length > 0) {
            result.amount = Math.max(...candidates).toFixed(2);
            console.log('Amount found in last lines:', result.amount);
        }
    }

    // Strategy 4: All numbers, filter phone numbers, pick largest
    if (!result.amount) {
        const allNums = [];
        const numPat = /([\d,]+(?:\.\d{1,2})?)/g;
        let m;
        while ((m = numPat.exec(text)) !== null) {
            const raw = m[1].replace(/,/g, '');
            const val = parseFloat(raw);
            // Skip phone numbers (10 digit numbers starting with 6-9)
            if (val >= 10 && val < 10000000 && !/^[6-9]\d{9}$/.test(raw)) {
                allNums.push(val);
            }
        }
        if (allNums.length > 0) {
            result.amount = Math.max(...allNums).toFixed(2);
            console.log('Amount found via fallback:', result.amount);
        }
    }

    // ── DATE ────────────────────────────────────────────────────────────────
    const datePatterns = [
        { pat: /(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4})/, fmt: 'dmy4' },
        { pat: /(\d{4})[\/\-\.](\d{2})[\/\-\.](\d{2})/, fmt: 'y4md' },
        { pat: /(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{2})/, fmt: 'dmy2' },
        { pat: /(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{4})/i, fmt: 'dmy_text' },
    ];
    for (const { pat, fmt } of datePatterns) {
        const dm = text.match(pat);
        if (dm) {
            try {
                let dateObj;
                if (fmt === 'dmy4') dateObj = new Date(`${dm[3]}-${dm[2]}-${dm[1]}`);
                else if (fmt === 'y4md') dateObj = new Date(`${dm[1]}-${dm[2]}-${dm[3]}`);
                else if (fmt === 'dmy2') dateObj = new Date(`20${dm[3]}-${dm[2]}-${dm[1]}`);
                else dateObj = new Date(`${dm[1]} ${dm[2]} ${dm[3]}`);
                if (!isNaN(dateObj.getTime())) {
                    result.date = dateObj.toISOString().split('T')[0];
                    break;
                }
            } catch { }
        }
    }

    // ── PAYEE / MERCHANT ────────────────────────────────────────────────────
    const skipWords = [
        'receipt', 'invoice', 'bill', 'tax', 'gst', 'date', 'time',
        'order', 'table', 'phone', 'email', 'address', 'thank', 'visit',
        'www', 'http', 'total', 'amount', 'cash', 'card', 'upi', 'paid',
        'subtotal', 'cgst', 'sgst', 'igst', 'vat', 'welcome', 'customer',
        'near', 'road', 'street', 'nagar', 'all types', 'available',
        'terms', 'condition', 'guarantee', 'return', 'exchange', 'no ',
    ];
    for (const line of lines.slice(0, 5)) {
        const clean = line.replace(/[^a-zA-Z\s]/g, '').trim();
        if (
            clean.length > 3 &&
            clean.length < 50 &&
            isNaN(line.replace(/[\s,\.]/g, '')) &&
            !skipWords.some(w => clean.toLowerCase().includes(w)) &&
            !/\d{7,}/.test(line) &&
            clean.split(' ').length <= 5
        ) {
            result.payee = clean.trim();
            break;
        }
    }

    // ── CATEGORY ────────────────────────────────────────────────────────────
    const lower = text.toLowerCase();
    if (/restaurant|cafe|coffee|food|pizza|burger|swiggy|zomato|hotel|dhaba|biryani|dine|eat|kitchen|bakery|chai|snack|lunch|dinner|breakfast/.test(lower))
        result.category = 'Food';
    else if (/uber|ola|petrol|fuel|metro|bus|auto|taxi|transport|parking|toll|cab|rapido|diesel/.test(lower))
        result.category = 'Transport';
    else if (/amazon|flipkart|mall|shop|store|mart|retail|fashion|cloth|saree|garment|shirt|pant|dress|myntra|supermarket|garments|cotton|lug|lungi|towel/.test(lower))
        result.category = 'Shopping';
    else if (/hospital|pharmacy|medical|doctor|clinic|health|medicine|apollo|medplus|lab|diagnostic/.test(lower))
        result.category = 'Health';
    else if (/movie|cinema|pvr|inox|netflix|entertainment|event|concert|game|play|sport/.test(lower))
        result.category = 'Entertainment';
    else if (/electricity|water|gas|internet|broadband|utility|bsnl|airtel|jio|vodafone|recharge/.test(lower))
        result.category = 'Utilities';
    else if (/rent|house|apartment|flat|lease|maintenance|society/.test(lower))
        result.category = 'Rent';

    // ── DESCRIPTION ─────────────────────────────────────────────────────────
    result.description = result.payee
        ? `${result.category} at ${result.payee}`
        : `${result.category} expense`;

    console.log('=== FINAL PARSED ===', result);
    return result;
};
export default function ReceiptScanner({ onDataExtracted, onClose }) {
    const [status, setStatus] = useState('idle'); // idle | scanning | done | error
    const [progress, setProgress] = useState(0);
    const [preview, setPreview] = useState(null);
    const [extracted, setExtracted] = useState(null);
    const fileRef = useRef();

    const processImage = async (file) => {
        if (!file) return;
        setStatus('scanning');
        setProgress(0);
        setPreview(URL.createObjectURL(file));

        try {
            const worker = await createWorker('eng', 1, {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        setProgress(Math.round(m.progress * 100));
                    }
                },
            });

            const { data: { text } } = await worker.recognize(file);
            await worker.terminate();

            const parsed = parseReceiptText(text);
            parsed.rawText = text;
            setExtracted(parsed);
            setStatus('done');
        } catch (err) {
            console.error(err);
            setStatus('error');
        }
    };

    const handleFile = e => {
        const file = e.target.files[0];
        if (file) processImage(file);
    };

    const handleDrop = e => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) processImage(file);
    };

    const handleUse = () => {
        if (extracted) onDataExtracted(extracted);
        onClose();
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24,
        }}>
            <div style={{
                background: '#1a1a2e',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 24, padding: 32,
                width: '100%', maxWidth: 520,
                animation: 'fadeInUp 0.3s ease',
            }}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <div>
                        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0' }}>Scan receipt</h2>
                        <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Upload a photo to auto-fill the form</p>
                    </div>
                    <button onClick={onClose} style={{
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 10, padding: '8px 10px', cursor: 'pointer', color: '#94a3b8',
                    }}>
                        <X size={18} />
                    </button>
                </div>

                {/* Upload area */}
                {status === 'idle' && (
                    <div
                        onDrop={handleDrop}
                        onDragOver={e => e.preventDefault()}
                        onClick={() => fileRef.current.click()}
                        style={{
                            border: '2px dashed rgba(79,70,229,0.4)',
                            borderRadius: 16, padding: '48px 24px',
                            textAlign: 'center', cursor: 'pointer',
                            background: 'rgba(79,70,229,0.05)',
                            transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(79,70,229,0.1)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(79,70,229,0.05)'}
                    >
                        <div style={{
                            width: 64, height: 64,
                            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                            borderRadius: 16, margin: '0 auto 16px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 0 24px rgba(79,70,229,0.4)',
                        }}>
                            <Camera size={28} color="white" />
                        </div>
                        <p style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 6 }}>
                            Drop your receipt here
                        </p>
                        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
                            or click to choose a photo
                        </p>
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            background: 'rgba(79,70,229,0.2)', border: '1px solid rgba(79,70,229,0.3)',
                            borderRadius: 8, padding: '6px 14px', fontSize: 12, color: '#a78bfa',
                        }}>
                            <Upload size={14} /> Browse files
                        </div>
                        <p style={{ fontSize: 11, color: '#475569', marginTop: 12 }}>
                            Supports JPG, PNG, WEBP
                        </p>
                        <input ref={fileRef} type="file" accept="image/*"
                            onChange={handleFile} style={{ display: 'none' }} />
                    </div>
                )}

                {/* Scanning progress */}
                {status === 'scanning' && (
                    <div style={{ textAlign: 'center', padding: '32px 0' }}>
                        {preview && (
                            <img src={preview} alt="receipt"
                                style={{ width: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 12, marginBottom: 24, opacity: 0.6 }} />
                        )}
                        <div style={{
                            width: 56, height: 56,
                            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                            borderRadius: '50%', margin: '0 auto 16px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            animation: 'pulse-glow 1.5s ease-in-out infinite',
                        }}>
                            <Loader size={24} color="white" style={{ animation: 'spin 1s linear infinite' }} />
                        </div>
                        <p style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 8 }}>
                            Reading receipt...
                        </p>
                        <div style={{
                            background: 'rgba(255,255,255,0.06)', borderRadius: 999, height: 8,
                            width: '100%', overflow: 'hidden', marginBottom: 8,
                        }}>
                            <div style={{
                                height: '100%', borderRadius: 999,
                                background: 'linear-gradient(90deg, #4f46e5, #7c3aed)',
                                width: `${progress}%`, transition: 'width 0.3s ease',
                            }} />
                        </div>
                        <p style={{ fontSize: 13, color: '#64748b' }}>{progress}% complete</p>
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    </div>
                )}

                {/* Results */}
                {status === 'done' && extracted && (
                    <div>
                        {preview && (
                            <img src={preview} alt="receipt"
                                style={{ width: '100%', maxHeight: 160, objectFit: 'contain', borderRadius: 12, marginBottom: 20, opacity: 0.8 }} />
                        )}


                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
                            background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
                            borderRadius: 10, padding: '10px 14px',
                        }}>
                            <CheckCircle size={16} color="#10b981" />
                            <span style={{ fontSize: 13, color: '#10b981', fontWeight: 500 }}>
                                Receipt scanned successfully
                            </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                            {[
                                { label: 'Amount', value: extracted.amount ? `₹${extracted.amount}` : '—' },
                                { label: 'Merchant', value: extracted.payee || '—' },
                                { label: 'Category', value: extracted.category || '—' },
                                { label: 'Date', value: extracted.date || '—' },
                                { label: 'Description', value: extracted.description || '—' },
                            ].map(({ label, value }) => (
                                <div key={label} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    background: 'rgba(255,255,255,0.04)',
                                    border: '1px solid rgba(255,255,255,0.07)',
                                    borderRadius: 10, padding: '10px 14px',
                                }}>
                                    <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>{label}</span>
                                    <span style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 600 }}>{value}</span>
                                </div>
                            ))}
                        </div>
                        {/* 
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={handleUse} style={{
                                flex: 1,
                                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                                color: 'white', border: 'none', borderRadius: 12,
                                padding: '12px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                            }}>
                                Use this data
                            </button>
                            <button onClick={() => { setStatus('idle'); setPreview(null); setExtracted(null); }}
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: 12, padding: '12px 16px', fontSize: 14, cursor: 'pointer',
                                }}>
                                Retry
                            </button>
                        </div> */}
                        <details style={{ marginTop: 12, marginBottom: 16 }}>
                            <summary style={{ fontSize: 12, color: '#64748b', cursor: 'pointer', userSelect: 'none' }}>
                                Show raw scanned text (for debugging)
                            </summary>
                            <pre style={{
                                fontSize: 10, color: '#475569', marginTop: 8,
                                background: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 8,
                                maxHeight: 200, overflow: 'auto', whiteSpace: 'pre-wrap',
                            }}>
                                {extracted?.rawText || 'No raw text'}
                            </pre>
                        </details>

                        <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={handleUse} style={{
                                flex: 1,
                                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                                color: 'white', border: 'none', borderRadius: 12,
                                padding: '12px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                            }}>
                                Use this data
                            </button>
                            <button onClick={() => { setStatus('idle'); setPreview(null); setExtracted(null); }}
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: 12, padding: '12px 16px', fontSize: 14, cursor: 'pointer',
                                }}>
                                Retry
                            </button>
                        </div>
                    </div>
                )}

                {/* Error */}
                {status === 'error' && (
                    <div style={{ textAlign: 'center', padding: '32px 0' }}>
                        <div style={{
                            width: 56, height: 56,
                            background: 'rgba(239,68,68,0.2)', borderRadius: '50%',
                            margin: '0 auto 16px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <AlertCircle size={24} color="#f87171" />
                        </div>
                        <p style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 8 }}>
                            Could not read receipt
                        </p>
                        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>
                            Try a clearer photo with better lighting
                        </p>
                        <button onClick={() => { setStatus('idle'); setPreview(null); }}
                            style={{
                                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                                color: 'white', border: 'none', borderRadius: 10,
                                padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                            }}>
                            Try again
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}