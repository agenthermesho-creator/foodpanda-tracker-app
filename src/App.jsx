import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import {
  App as F7App,
  View,
  Page,
  Navbar,
  Block,
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

// ─── Stat card ────────────────────────────────────────────────────────

function StatCard({ label, value, color, delay }) {
  return (
    <motion.div className="sc" {...staggerItem(delay)}>
      <div className="sc-l">{label}</div>
      <div className="sc-v" style={{ color: color || "#111" }}>{value}</div>
    </motion.div>
  );
}

// ─── Year section ─────────────────────────────────────────────────────

function YearSection({ year, data }) {
  const [expandedStore, setExpandedStore] = useState(null);
  const totalPaid = data.totalPaid || 0;
  const foodCost = data.foodCost || 0;
  const netDelivery = data.netDelivery || 0;
  const platFee = data.platFee || 0;
  const hasData = totalPaid > 0 || foodCost > 0;

  return (
    <div className="yc">
      <div className="yh">
        <span className="yl">{year}</span>
        <span className="yb">{data.count} order{data.count !== 1 ? "s" : ""}</span>
      </div>

      {hasData ? (
        <>
          <div className="sg">
            <StatCard label="Total Paid" value={formatSGD(totalPaid)} color="#007aff" delay={0} />
            <StatCard label="Food Cost" value={formatSGD(foodCost)} color="#8B5CF6" delay={1} />
            <StatCard label="Delivery" value={formatSGD(netDelivery)} color="#34C759" delay={2} />
            <StatCard label="Fees" value={formatSGD(platFee)} color="#FF9500" delay={3} />
          </div>

          {data.stores.filter(s => s.name !== "Unknown").slice(0, 10).length > 0 && (
            <>
              <div className="sl">Top Stores</div>
              {data.stores.filter(s => s.name !== "Unknown").slice(0, 10).map((store, si) => (
                <div key={store.name} className="scard" onClick={() => setExpandedStore(expandedStore === si ? null : si)}>
                  <div className="sh">
                    <span className="sr">#{si + 1}</span>
                    <span className="sn">{store.name}</span>
                    <span className="sco">{store.count}</span>
                    <span className="sa">{expandedStore === si ? "▲" : "▼"}</span>
                  </div>
                  {expandedStore === si && (
                    <div className="sd">
                      <div className="ssr"><span>Total Paid</span><span className="green">{formatSGD(store.totalPaid)}</span></div>
                      <div className="ssr"><span>Orders</span><span>{store.count}</span></div>
                      {store.items?.length > 0 && (
                        <>
                          <div className="il">Top Items</div>
                          {store.items.map((item, ii) => (
                            <div key={ii} className="ir"><span>{item.name}</span><span className="iq">{item.qty}</span></div>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </>
      ) : (
        <div className="en">Order data recorded, but no financial details extracted for this period.</div>
      )}
    </div>
  );
}

// ─── Dashboard Page ────────────────────────────────────────────────────

function DashboardPage({ data, loading }) {
  const years = data ? Object.keys(data.years) : [];

  if (loading) {
    return <div className="ls"><div className="ldr"></div><p>Crunching your orders…</p></div>;
  }
  if (!data) {
    return <div className="er"><p>Could not load data.</p></div>;
  }

  return (
    <Page name="dashboard">
      <Navbar title="Foodpanda" />
      <div className="pc">
        {/* All-time summary */}
        <div className="atc">
          <div className="ath"><span className="ati">🍔</span><span className="att">All Time</span></div>
          <div className="atg">
            <div className="ats"><span className="atv">{data.allTime.count}</span><span className="atl">Orders</span></div>
            <div className="ats"><span className="atv">{formatSGD(data.allTime.totalPaid)}</span><span className="atl">Total Spent</span></div>
            <div className="ats"><span className="atv">{formatSGD(data.allTime.foodCost)}</span><span className="atl">Food Cost</span></div>
            <div className="ats"><span className="atv">{formatSGD(data.allTime.netDelivery)}</span><span className="atl">Delivery Fees</span></div>
          </div>
        </div>

        {years.map((yr) => <YearSection key={yr} year={yr} data={data.years[yr]} />)}

        <div className="pf">Data from your foodpanda receipts. Updated daily.</div>
      </div>
    </Page>
  );
}

// ─── Stores page ──────────────────────────────────────────────────────

function StoresPage({ data, loading }) {
  if (loading || !data) return null;

  const allStores = {};
  for (const yr of Object.values(data.years)) {
    for (const s of yr.stores) {
      if (s.name === "Unknown") continue;
      if (!allStores[s.name]) allStores[s.name] = { name: s.name, count: 0, totalPaid: 0 };
      allStores[s.name].count += s.count;
      allStores[s.name].totalPaid += s.totalPaid;
    }
  }

  const sorted = Object.values(allStores).sort((a, b) => b.count - a.count);
  const [expandedStore, setExpandedStore] = useState(null);

  return (
    <Page name="stores">
      <Navbar title="All Stores" />
      <div className="pc">
        <div className="stc">{sorted.length} stores ordered from</div>

        {sorted.map((store, si) => (
          <div key={store.name} className="scard" onClick={() => setExpandedStore(expandedStore === si ? null : si)}>
            <div className="sh">
              <span className="sr">#{si + 1}</span>
              <span className="sn">{store.name}</span>
              <span className="sco">{store.count}</span>
              <span className="sa">{expandedStore === si ? "▲" : "▼"}</span>
            </div>
            {expandedStore === si && (
              <div className="sd">
                <div className="ssr"><span>Total Paid</span><span className="green">{formatSGD(store.totalPaid)}</span></div>
                <div className="ssr"><span>Orders</span><span>{store.count}</span></div>
              </div>
            )}
          </div>
        ))}
      </div>
    </Page>
  );
}

// ─── Root App ──────────────────────────────────────────────────────────

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    loadData().then((d) => { setData(d); setLoading(false); });
  }, []);

  return (
    <F7App {...f7params}>
      <View main iosDynamicNavbar={false}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<DashboardPage data={data} loading={loading} />} />
          <Route path="/stores" element={<StoresPage data={data} loading={loading} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

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
