import { useState, useEffect, useCallback, useRef } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import {
  App as F7App,
  View,
  Page,
  Navbar,
  Block,
  List,
  ListItem,
  Icon,
  Link,
  Toolbar,
  Preloader,
} from "framework7-react";
import { motion, AnimatePresence } from "framer-motion";
import { loadData, formatSGD } from "./lib/data";

const f7params = {
  name: "Foodpanda Tracker",
  theme: "auto",
  iosTranslucent: true,
  iosSwipeBack: true,
  touch: { tapHold: true, fastClicks: true },
};

// ─── Motion variants ──────────────────────────────────────────────────

const pageEnter = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
};

const staggerItem = (i) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.04, duration: 0.35, ease: "easeOut" },
});

const cardHover = { whileHover: { scale: 1.02 }, whileTap: { scale: 0.98 } };

// ─── Stat card component ────────────────────────────────────────────────

function StatCard({ label, value, color, delay }) {
  return (
    <motion.div
      className="stat-card"
      {...staggerItem(delay)}
    >
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ color: color || "var(--f7-text-color)" }}>
        {value}
      </div>
    </motion.div>
  );
}

// ─── Year card with store accordion ─────────────────────────────────────

function YearSection({ year, data, isOpen }) {
  const [expandedStore, setExpandedStore] = useState(null);

  return (
    <motion.div
      className="year-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Year header */}
      <div className="year-header" onClick={() => {}}>
        <div className="year-header-left">
          <span className="year-label">{year}</span>
          <span className="year-badge">{data.count} order{data.count !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Summary grid */}
      <div className="year-content">
        <div className="summary-grid">
          <StatCard label="Total Paid" value={formatSGD(data.totalPaid)} color="#007aff" delay={0} />
          <StatCard label="Food Cost" value={formatSGD(data.foodCost)} color="#8B5CF6" delay={1} />
          <StatCard label="Delivery (net)" value={formatSGD(data.netDelivery)} color="#34C759" delay={2} />
          <StatCard label="Platform Fees" value={formatSGD(data.platFee)} color="#FF9500" delay={3} />
        </div>

        {/* Top stores */}
        <div className="stores-label">Top Stores</div>
        {data.stores.map((store, si) => (
          <motion.div key={store.name} {...staggerItem(si + 4)}>
            <div
              className={`store-card ${expandedStore === si ? "expanded" : ""}`}
              onClick={() => setExpandedStore(expandedStore === si ? null : si)}
            >
              <div className="store-header">
                <span className="store-rank">#{si + 1}</span>
                <span className="store-name">{store.name}</span>
                <span className="store-count">{store.count}</span>
                <span className="store-arrow">{expandedStore === si ? "▲" : "▼"}</span>
              </div>

              <AnimatePresence>
                {expandedStore === si && (
                  <motion.div
                    className="store-detail"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="store-summary-row">
                      <span>Total Paid</span>
                      <span className="value green">{formatSGD(store.totalPaid)}</span>
                    </div>
                    <div className="store-summary-row">
                      <span>Orders</span>
                      <span className="value">{store.count}</span>
                    </div>

                    {store.items && store.items.length > 0 && (
                      <>
                        <div className="items-label">Top Items</div>
                        {store.items.map((item, ii) => (
                          <div key={ii} className="item-row">
                            <span className="item-name">{item.name}</span>
                            <span className="item-qty">{item.qty}</span>
                          </div>
                        ))}
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Dashboard Page ─────────────────────────────────────────────────────

function DashboardPage({ data, loading }) {
  const years = data ? Object.keys(data.years) : [];

  return (
    <Page name="dashboard">
      <Navbar title="Foodpanda" />

      {loading ? (
        <Block className="loading-block">
          <Preloader />
          <p className="loading-text">Crunching your orders…</p>
        </Block>
      ) : !data ? (
        <Block className="error-block">
          <p>Could not load data.</p>
        </Block>
      ) : (
        <motion.div className="page-content" {...pageEnter}>
          {/* All-time summary */}
          <Block className="alltime-block">
            <div className="alltime-header">
              <span className="alltime-icon">🍔</span>
              <span className="alltime-title">All Time</span>
            </div>
            <div className="alltime-grid">
              <div className="alltime-stat">
                <span className="alltime-value">{data.allTime.count}</span>
                <span className="alltime-label">Orders</span>
              </div>
              <div className="alltime-stat">
                <span className="alltime-value">{formatSGD(data.allTime.totalPaid)}</span>
                <span className="alltime-label">Total Spent</span>
              </div>
              <div className="alltime-stat">
                <span className="alltime-value">{formatSGD(data.allTime.foodCost)}</span>
                <span className="alltime-label">Food Cost</span>
              </div>
              <div className="alltime-stat">
                <span className="alltime-value">{formatSGD(data.allTime.netDelivery)}</span>
                <span className="alltime-label">Delivery Fees</span>
              </div>
            </div>
          </Block>

          {/* Year cards */}
          {years.map((yr) => (
            <YearSection key={yr} year={yr} data={data.years[yr]} />
          ))}

          <div className="page-footer">
            Data from your foodpanda receipts. Updated daily at 2 AM.
          </div>
        </motion.div>
      )}
    </Page>
  );
}

// ─── Stores page ────────────────────────────────────────────────────────

function StoresPage({ data, loading }) {
  if (loading || !data) return null;

  // Build an all-time store ranking from all years
  const allStores = {};
  for (const yr of Object.values(data.years)) {
    for (const s of yr.stores) {
      if (!allStores[s.name]) {
        allStores[s.name] = { name: s.name, count: 0, totalPaid: 0 };
      }
      allStores[s.name].count += s.count;
      allStores[s.name].totalPaid += s.totalPaid;
    }
  }

  const sorted = Object.values(allStores)
    .sort((a, b) => b.count - a.count);

  const [expandedStore, setExpandedStore] = useState(null);

  return (
    <Page name="stores">
      <Navbar title="All Stores" />
      <motion.div className="page-content" {...pageEnter}>
        <Block className="stores-count-block">
          <span className="stores-total">{sorted.length} stores ordered from</span>
        </Block>

        {sorted.map((store, si) => {
          const yrStore = data.years["2026"]?.stores?.find(s => s.name === store.name);
          return (
            <motion.div key={store.name} {...staggerItem(si)}>
              <div
                className={`store-card ${expandedStore === si ? "expanded" : ""}`}
                onClick={() => setExpandedStore(expandedStore === si ? null : si)}
              >
                <div className="store-header">
                  <span className="store-rank">#{si + 1}</span>
                  <span className="store-name">{store.name}</span>
                  <span className="store-count">{store.count}</span>
                  <span className="store-arrow">{expandedStore === si ? "▲" : "▼"}</span>
                </div>

                <AnimatePresence>
                  {expandedStore === si && (
                    <motion.div
                      className="store-detail"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className="store-summary-row">
                        <span>Total Paid</span>
                        <span className="value green">{formatSGD(store.totalPaid)}</span>
                      </div>
                      <div className="store-summary-row">
                        <span>Orders</span>
                        <span className="value">{store.count}</span>
                      </div>

                      {yrStore?.items?.length > 0 && (
                        <>
                          <div className="items-label">Top Items</div>
                          {yrStore.items.map((item, ii) => (
                            <div key={ii} className="item-row">
                              <span className="item-name">{item.name}</span>
                              <span className="item-qty">{item.qty}</span>
                            </div>
                          ))}
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </Page>
  );
}

// ─── Root App ────────────────────────────────────────────────────────────

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    loadData().then((d) => {
      setData(d);
      setLoading(false);
    });
  }, []);

  return (
    <F7App {...f7params}>
      <View main iosDynamicNavbar={false}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<DashboardPage data={data} loading={loading} />} />
            <Route path="/stores" element={<StoresPage data={data} loading={loading} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>

        <Toolbar tabbar labels bottom>
          <Link tabLink active routeTabId="dashboard" href="#/">
            <Icon ios="f7:house_fill" md="material:home" />
            <span className="tabbar-label">Dashboard</span>
          </Link>
          <Link tabLink routeTabId="stores" href="#/stores">
            <Icon ios="f7:building_2_fill" md="material:store" />
            <span className="tabbar-label">Stores</span>
          </Link>
        </Toolbar>
      </View>
    </F7App>
  );
}
