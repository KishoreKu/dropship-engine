import { useState } from 'react';
import { api } from '../services/api';

export default function ResearchPage() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const research = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    try {
      const data = await api.crossReference(query);
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Product Research</h1>
      <p style={{ color: '#64748b', marginBottom: 24 }}>
        Cross-reference products across Amazon (JungleScout) and AliExpress to find winning products.
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && research()}
          placeholder="e.g., wireless earbuds, yoga mat, phone stand…"
          style={{ flex: 1, padding: '0.6rem 1rem', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }}
        />
        <button onClick={research} disabled={loading} style={{
          padding: '0.6rem 1.5rem', borderRadius: 8, border: 'none', background: '#8b5cf6', color: '#fff', fontWeight: 600, cursor: 'pointer',
        }}>
          {loading ? 'Analyzing…' : 'Cross-Reference'}
        </button>
      </div>

      {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}

      {result && (
        <div style={{ display: 'grid', gap: 24 }}>
          {result.analysis && (
            <div style={{ background: '#fff', borderRadius: 10, padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Market Analysis — {result.analysis.category}</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
                {[
                  { label: 'Avg Price', value: `$${result.analysis.avgPrice.toFixed(2)}` },
                  { label: 'Avg Rating', value: `★ ${result.analysis.avgRating.toFixed(1)}` },
                  { label: 'Avg Monthly Sales', value: Math.round(result.analysis.avgMonthlySales).toLocaleString() },
                  { label: 'Total Products', value: result.analysis.totalProducts.toLocaleString() },
                  { label: 'Avg Revenue', value: `$${Math.round(result.analysis.avgRevenue).toLocaleString()}` },
                  { label: 'Competition', value: result.analysis.competitionLevel },
                ].map((s) => (
                  <div key={s.label}>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{s.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: '#fff', borderRadius: 10, padding: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#059669' }}>Amazon Products</h3>
              {result.amazon?.slice(0, 5).map((p: any) => (
                <div key={p.asin} style={{ padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                  <div style={{ fontWeight: 600 }}>{p.title}</div>
                  <div style={{ color: '#64748b' }}>${p.price} · {p.monthlySales}/mo · ★ {p.rating}</div>
                </div>
              ))}
            </div>
            <div style={{ background: '#fff', borderRadius: 10, padding: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#dc2626' }}>AliExpress Products</h3>
              {result.aliexpress?.slice(0, 5).map((p: any) => (
                <div key={p.productId} style={{ padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                  <div style={{ fontWeight: 600 }}>{p.title}</div>
                  <div style={{ color: '#64748b' }}>${p.price} · {p.sales} sales</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
