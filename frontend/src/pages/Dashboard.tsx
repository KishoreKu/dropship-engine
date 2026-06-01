import { useEffect, useState } from 'react';
import { api } from '../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState({ imported: 0, orders: 0, unfulfilled: 0, fulfillments: 0 });
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.listImported(),
      api.listOrders('?limit=1'),
      api.getUnfulfilledOrders(),
      api.listFulfillments(),
    ])
      .then(([imported, orders, unfulfilled, fulfillments]) => {
        setStats({
          imported: imported.products.length,
          orders: (orders as any).orders?.length || 0,
          unfulfilled: unfulfilled.orders.length,
          fulfillments: fulfillments.orders.length,
        });
      })
      .catch((e) => setError(e.message));
  }, []);

  const cards = [
    { label: 'Imported Products', value: stats.imported, color: '#3b82f6' },
    { label: 'Shopify Orders', value: stats.orders, color: '#10b981' },
    { label: 'Unfulfilled', value: stats.unfulfilled, color: '#f59e0b' },
    { label: 'Fulfillments', value: stats.fulfillments, color: '#8b5cf6' },
  ];

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Dashboard</h1>
      <p style={{ color: '#64748b', marginBottom: 24 }}>
        Multi-channel dropshipping overview — Shopify + AliExpress + DSers + JungleScout
      </p>
      {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        {cards.map((c) => (
          <div key={c.label} style={{ background: '#fff', borderRadius: 10, padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>{c.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 32, background: '#fff', borderRadius: 10, padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Product Research</h2>
        <p style={{ color: '#64748b', fontSize: 14 }}>
          Use the <strong>Research</strong> tab to cross-reference products across Amazon and AliExpress via JungleScout.
          Import winning products with one click, and they sync to your Shopify store automatically through DSers fulfillment.
        </p>
      </div>
    </div>
  );
}
