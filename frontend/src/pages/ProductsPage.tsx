import { useEffect, useState } from 'react';
import { api } from '../services/api';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listImported().then((res) => {
      setProducts(res.products);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Imported Products</h1>
      {loading && <p>Loading…</p>}
      {!loading && products.length === 0 && (
        <p style={{ color: '#64748b' }}>No products imported yet. Go to <strong>Import</strong> to add products from AliExpress.</p>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {products.map((p) => (
          <div key={p.id} style={{ background: '#fff', borderRadius: 10, padding: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            {p.images?.[0] && (
              <img src={p.images[0]} alt={p.title} style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 6, marginBottom: 8 }} />
            )}
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{p.title}</div>
            <div style={{ color: '#3b82f6', fontWeight: 700 }}>${p.price}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>SKU: {p.sku}</div>
            <div style={{ fontSize: 12, color: p.status === 'imported' ? '#10b981' : '#f59e0b', marginTop: 2 }}>
              {p.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
