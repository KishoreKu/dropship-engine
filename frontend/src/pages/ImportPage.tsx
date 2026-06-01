import { useState } from 'react';
import { api } from '../services/api';

export default function ImportPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setMsg('');
    try {
      const res = await api.searchAliExpress(query);
      setResults(res.products || []);
    } catch (e: any) {
      setMsg(e.message);
    }
    setLoading(false);
  };

  const importProduct = async (p: any) => {
    try {
      const result = await api.importProduct({
        productId: p.productId,
        title: p.title,
        price: p.price,
        imageUrl: p.imageUrl,
        shopName: p.shopName,
        sales: p.sales,
        rating: p.rating,
        detailUrl: p.detailUrl,
      });
      setMsg(`Imported: ${result.title}`);
      setResults((prev) => prev.filter((r) => r.productId !== p.productId));
    } catch (e: any) {
      setMsg(`Import failed: ${e.message}`);
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Import Products</h1>
      <p style={{ color: '#64748b', marginBottom: 24 }}>Search AliExpress products and import them to your Shopify store.</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search()}
          placeholder="Search AliExpress…"
          style={{ flex: 1, padding: '0.6rem 1rem', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }}
        />
        <button onClick={search} disabled={loading} style={{
          padding: '0.6rem 1.5rem', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 600, cursor: 'pointer',
        }}>
          {loading ? 'Searching…' : 'Search'}
        </button>
      </div>

      {msg && <div style={{ padding: '0.75rem 1rem', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, marginBottom: 16, fontSize: 14 }}>{msg}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {results.map((p) => (
          <div key={p.productId} style={{ background: '#fff', borderRadius: 10, padding: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <img src={p.imageUrl} alt={p.title} style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 6, marginBottom: 8 }} />
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{p.title}</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
              <span style={{ color: '#3b82f6', fontWeight: 700 }}>${p.price}</span>
              {p.originalPrice && <span style={{ color: '#94a3b8', textDecoration: 'line-through', fontSize: 12 }}>${p.originalPrice}</span>}
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>
              {p.sales} sales · ★ {p.rating} · {p.shopName}
            </div>
            <button onClick={() => importProduct(p)} style={{
              width: '100%', padding: '0.5rem', borderRadius: 6, border: 'none', background: '#10b981', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 13,
            }}>
              Import to Shopify
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
