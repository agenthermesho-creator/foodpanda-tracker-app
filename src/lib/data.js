/**
 * foodpanda-data.js — Load and process foodpanda order data
 * Fetches the static JSON and processes it into yearly aggregates.
 */
const DATA_URL = `${import.meta.env.BASE_URL}foodpanda-data.json`;

export async function loadData() {
  const res = await fetch(DATA_URL);
  const raw = await res.json();
  return processData(raw);
}

function processData(raw) {
  const ordersRaw = raw.orders || [];
  const itemsRaw = raw.items || [];

  if (ordersRaw.length < 2) return {};
  const header = ordersRaw[0];
  const orders = ordersRaw.slice(1).map(r => ({
    emailId: r[0] || '',
    store: r[1] || 'Unknown',
    orderDate: r[2] || '',
    year: parseInt(r[3]) || 0,
    orderNumber: r[4] || '',
    subtotal: parseFloat(r[5]) || 0,
    deliveryFee: parseFloat(r[6]) || 0,
    deliveryFeeDiscount: parseFloat(r[7]) || 0,
    platformFee: parseFloat(r[8]) || 0,
    voucher: parseFloat(r[9]) || 0,
    discount: parseFloat(r[10]) || 0,
    total: parseFloat(r[11]) || 0,
    paymentMethod: r[12] || '',
  }));

  // Build items map: store -> item -> qty
  const itemsMap = {};
  if (itemsRaw.length > 1) {
    for (let i = 1; i < itemsRaw.length; i++) {
      const r = itemsRaw[i];
      const store = r[1];
      const name = r[2] || 'Unknown';
      const qty = parseInt(r[3]) || 1;
      if (!store) continue;
      if (!itemsMap[store]) itemsMap[store] = {};
      if (!itemsMap[store][name]) itemsMap[store][name] = 0;
      itemsMap[store][name] += qty;
    }
  }

  // Process each store's top items
  const storeItems = {};
  for (const store of Object.keys(itemsMap)) {
    storeItems[store] = Object.keys(itemsMap[store])
      .map(name => ({ name, qty: itemsMap[store][name] }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10);
  }

  // Build yearly aggregates
  const years = {};
  for (const o of orders) {
    const yr = o.year;
    if (!years[yr]) {
      years[yr] = { count: 0, totalPaid: 0, netDelivery: 0, platFee: 0, foodCost: 0, stores: {} };
    }
    const y = years[yr];
    y.count++;
    y.totalPaid += o.total;
    y.netDelivery += (o.deliveryFee - o.deliveryFeeDiscount);
    y.platFee += o.platformFee;
    y.foodCost += (o.total - (o.deliveryFee - o.deliveryFeeDiscount) - o.platformFee);

    if (!y.stores[o.store]) {
      y.stores[o.store] = { count: 0, totalPaid: 0, netDelivery: 0, platFee: 0, foodCost: 0 };
    }
    const s = y.stores[o.store];
    s.count++;
    s.totalPaid += o.total;
    s.netDelivery += (o.deliveryFee - o.deliveryFeeDiscount);
    s.platFee += o.platformFee;
    s.foodCost += (o.total - (o.deliveryFee - o.deliveryFeeDiscount) - o.platformFee);
  }

  // Build result
  const result = {};
  for (const yr of Object.keys(years).sort().reverse()) {
    const y = years[yr];
    const storeList = Object.keys(y.stores)
      .map(s => ({
        name: s,
        count: y.stores[s].count,
        totalPaid: round(y.stores[s].totalPaid),
        items: storeItems[s] || [],
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    result[yr] = {
      count: y.count,
      totalPaid: round(y.totalPaid),
      netDelivery: round(y.netDelivery),
      platFee: round(y.platFee),
      foodCost: round(y.foodCost),
      stores: storeList,
    };
  }

  // Also compute all-time totals
  const allTime = { count: 0, totalPaid: 0, netDelivery: 0, platFee: 0, foodCost: 0 };
  for (const yr of Object.values(result)) {
    allTime.count += yr.count;
    allTime.totalPaid += yr.totalPaid;
    allTime.netDelivery += yr.netDelivery;
    allTime.platFee += yr.platFee;
    allTime.foodCost += yr.foodCost;
  }
  allTime.totalPaid = round(allTime.totalPaid);
  allTime.netDelivery = round(allTime.netDelivery);
  allTime.platFee = round(allTime.platFee);
  allTime.foodCost = round(allTime.foodCost);

  return { years: result, allTime };
}

function round(n) {
  return Math.round(n * 100) / 100;
}

export function formatSGD(n) {
  return 'S$ ' + n.toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
