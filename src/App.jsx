import { useState, useEffect } from "react";
import { HashRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { loadData, formatSGD } from "./lib/data";

// ─── Logo component ────────────────────────────────────────────────────

function Logo() {
  return (
    <div className="fp-header">
      <div className="fp-header-top">
        <h1 className="fp-title">🍔 Foodpanda</h1>
        <span className="fp-badge">Tracker</span>
      </div>
      <p className="fp-sub">Your delivery history at a glance</p>
    </div>
  );
}

// ─── Stat card ─────────────────────────────────────────────────────────

function StatCard({ label, value, color, delay }) {
  return (
    <motion.div
      className="stat-card"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.06, duration: 0.35 }}
    >
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-value" style={{ color: color || "#007aff" }}>{value}</div>
    </motion.div>
  );
}

// ─── Year card with stores ─────────────────────────────────────────────

function YearCard({ year, data, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  const [expandedStore, setExpandedStore] = useState(null);
  const hasData = (data.totalPaid || data.foodCost) > 0;

  return (
    <div className={`year-card ${open ? "open" : ""}`}>
      <div className="year-card-summary" onClick={() => setOpen(!open)}>
        <div className="year-card-left">
          <span className="year-card-year">{year}</span>
          <span className="year-card-count">{data.count} order{data.count !== 1 ? "s" : ""}</span>
        </div>
        <span className="year-card-arrow">{open ? "▲" : "▼"}</span>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            className="year-card-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {hasData ? (
              <>
                <div className="year-card-stats">
                  <StatCard label="Total Paid" value={formatSGD(data.totalPaid)} color="#007aff" delay={0} />
                  <StatCard label="Food Cost" value={formatSGD(data.foodCost)} color="#8B5CF6" delay={1} />
                  <StatCard label="Delivery" value={formatSGD(data.netDelivery)} color="#34C759" delay={2} />
                  <StatCard label="Fees" value={formatSGD(data.platFee)} color="#FF9500" delay={3} />
                </div>

                <div className="year-card-stores">
                  <div className="stores-header">Top Stores</div>
                  {data.stores.filter(s => s.name !== "Unknown").slice(0, 10).map((store, si) => (
                    <div key={store.name} className={`store-row ${expandedStore === si ? "expanded" : ""}`}>
                      <div className="store-row-summary" onClick={() => setExpandedStore(expandedStore === si ? null : si)}>
                        <span className="store-rank">#{si + 1}</span>
                        <span className="store-name">{store.name}</span>
                        <span className="store-order-count">{store.count}</span>
                        <span className="store-arrow">{expandedStore === si ? "▲" : "▼"}</span>
                      </div>

                      <AnimatePresence>
                        {expandedStore === si && (
                          <motion.div
                            className="store-detail"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className="store-detail-row">
                              <span>Total Paid</span>
                              <span className="green">{formatSGD(store.totalPaid)}</span>
                            </div>
                            <div className="store-items-header">Top Items</div>
                            {store.items && store.items.length > 0 ? (
                              store.items.map((item, ii) => (
                                <div key={ii} className="store-item-row">
                                  <span className="store-item-name">{item.name}</span>
                                  <span className="store-item-qty">{item.qty}</span>
                                </div>
                              ))
                            ) : (
                              <div className="store-item-row no-items">No item data for this store</div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="year-card-empty">
                Order data recorded, but no financial details extracted for this period.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Dashboard Page ────────────────────────────────────────────────────

function Dashboard({ data, loading }) {
  if (loading) {
    return (
      <div className="page-wrap">
        <Logo />
        <div className="loading-state">
          <div className="loader"></div>
          <p>Loading your data…</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page-wrap">
        <Logo />
        <div className="error-state">
          <p>Could not load data.</p>
        </div>
      </div>
    );
  }

  const years = Object.keys(data.years);

  return (
    <div className="page-wrap">
      <Logo />

      {/* All-time summary */}
      <div className="alltime-card">
        <div className="alltime-header">
          <span className="alltime-icon">🍔</span>
          <span className="alltime-title">All Time</span>
        </div>
        <div className="alltime-grid">
          <div className="alltime-stat">
            <span className="alltime-value">{formatSGD(data.allTime.totalPaid)}</span>
            <span className="alltime-label">Total spent</span>
          </div>
          <div className="alltime-stat">
            <span className="alltime-value">{data.allTime.count}</span>
            <span className="alltime-label">Orders</span>
          </div>
          <div className="alltime-stat">
            <span className="alltime-value">{formatSGD(data.allTime.foodCost)}</span>
            <span className="alltime-label">Food cost</span>
          </div>
          <div className="alltime-stat">
            <span className="alltime-value">{formatSGD(data.allTime.netDelivery)}</span>
            <span className="alltime-label">Delivery fees</span>
          </div>
        </div>
      </div>

      {/* Year cards */}
      {years.map((yr, i) => (
        <YearCard key={yr} year={yr} data={data.years[yr]} defaultOpen={yr === "2026" || i === 0} />
      ))}

      <div className="page-footer">
        Updated from your foodpanda receipts. Data refreshes daily.
      </div>
    </div>
  );
}

// ─── Root App ──────────────────────────────────────────────────────────

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData().then((d) => {
      setData(d);
      setLoading(false);
    });
  }, []);

  return (
    <HashRouter>
      <div className="app-shell">
        <Dashboard data={data} loading={loading} />
      </div>
    </HashRouter>
  );
}
