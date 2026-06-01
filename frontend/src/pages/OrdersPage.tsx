import { useEffect, useState } from 'react';
import { api } from '../services/api';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [fulfillments, setFulfillments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [ordRes, fulRes] = await Promise.all([
      api.listOrders('?limit=20').catch(() => ({ orders: [] })),
      api.listFulfillments().catch(() => ({ orders: [] })),
    ]);
    setOrders(ordRes.orders);
    setFulfillments(fulRes.orders);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const fulfill = async (orderId: number) => {
    try {
      await api.createFulfillment(orderId);
      load();
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Orders & Fulfillment</h1>
      {loading && <p>Loading…</p>}
      {!loading && (
        <>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Shopify Orders</h2>
          <div style={{ display: 'grid', gap: 8, marginBottom: 32 }}>
            {orders.slice(0, 10).map((o) => (
              <div key={o.id} style={{ background: '#fff', borderRadius: 8, padding: '0.75rem 1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>#{o.orderNumber}</strong> — {o.email}
                  <div style={{ fontSize: 12, color: '#64748b' }}>{o.financialStatus} · {o.fulfillmentStatus}</div>
                </div>
                <button onClick={() => fulfill(o.id)} disabled={o.fulfillmentStatus === 'fulfilled'} style={{
                  padding: '0.4rem 1rem', borderRadius: 6, border: 'none', background: o.fulfillmentStatus === 'fulfilled' ? '#e2e8f0' : '#3b82f6', color: o.fulfillmentStatus === 'fulfilled' ? '#94a3b8' : '#fff', fontWeight: 600, cursor: o.fulfillmentStatus === 'fulfilled' ? 'default' : 'pointer', fontSize: 12,
                }}>
                  {o.fulfillmentStatus === 'fulfilled' ? 'Fulfilled' : 'Fulfill via DSers'}
                </button>
              </div>
            ))}
          </div>

          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Fulfillment Orders</h2>
          <div style={{ display: 'grid', gap: 8 }}>
            {fulfillments.map((f) => (
              <div key={f.id} style={{ background: '#fff', borderRadius: 8, padding: '0.75rem 1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <strong>Order #{f.shopifyOrderId}</strong>
                    <div style={{ fontSize: 12, color: '#64748b' }}>DSers ID: {f.dsersOrderId || 'pending'}</div>
                  </div>
                  <span style={{
                    padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                    background: f.status === 'shipped' ? '#dcfce7' : f.status === 'processing' ? '#fef9c3' : '#f1f5f9',
                    color: f.status === 'shipped' ? '#166534' : f.status === 'processing' ? '#854d0e' : '#475569',
                  }}>
                    {f.status}
                  </span>
                </div>
                {f.trackingNumber && (
                  <div style={{ fontSize: 12, marginTop: 4 }}>
                    Tracking: {f.trackingNumber}
                    {f.trackingUrl && <a href={f.trackingUrl} target="_blank" rel="noopener" style={{ marginLeft: 8, color: '#3b82f6' }}>Track</a>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
