// ============================================================
// NURTUREDCHOICE PRODUCTS — DATA LAYER (Backend)
// ============================================================

const DB = {
  // ---- Persistence ----
  save(key, data) {
    try { localStorage.setItem('nc_' + key, JSON.stringify(data)); } catch(e) {}
  },
  load(key, fallback = []) {
    try {
      const d = localStorage.getItem('nc_' + key);
      return d ? JSON.parse(d) : fallback;
    } catch(e) { return fallback; }
  },

  // ---- Products Catalog ----
  PRODUCTS: [
    // Honey
    { id: 'H100',  category: 'honey',        name: 'Quick Health Pure Honey 100g',           icon: '🍯', price: 64,  size: '100g',  variety: null },
    { id: 'H200',  category: 'honey',        name: 'Quick Health Pure Honey 200g',           icon: '🍯', price: 120,  size: '200g',  variety: null },
    { id: 'H300RJ',  category: 'honey',        name: 'Quick Health Pure Honey 300g RoundJar',           icon: '🍯', price: 168,  size: '300gRJ',  variety: null },
    { id: 'H300SJ',  category: 'honey',        name: 'Quick Health Pure Honey 300g SqueezeJar',           icon: '🍯', price: 168,  size: '300gSJ',  variety: null },
    { id: 'H500RJ',  category: 'honey',        name: 'Quick Health Pure Honey 500g RoundJar',           icon: '🍯', price: 260,  size: '500gRJ',  variety: null },
    { id: 'H500SJ',  category: 'honey',        name: 'Quick Health Pure Honey 500g SqueezeJar',           icon: '🍯', price: 260,  size: '500gSJ',  variety: null },
    { id: 'H1KG',  category: 'honey',        name: 'Quick Health Pure Honey 1kg',            icon: '🍯', price: 520, size: '1kg',   variety: null },
    // Peanut Butter — Smooth
    { id: 'PBS150', category: 'peanut_butter', name: 'Sweetnut Peanut Butter Smooth 150g', icon: '🥜', price: 92,  size: '150g',  variety: 'smooth' },
    { id: 'PBS250', category: 'peanut_butter', name: 'Sweetnut Peanut Butter Smooth 250g', icon: '🥜', price: 148,  size: '250g',  variety: 'smooth' },
    { id: 'PBS400', category: 'peanut_butter', name: 'Sweetnut Peanut Butter Smooth 400g', icon: '🥜', price: 224,  size: '400g',  variety: 'smooth' },
    { id: 'PBS800', category: 'peanut_butter', name: 'Sweetnut Peanut Butter Smooth 800g', icon: '🥜', price: 412,  size: '800g',  variety: 'smooth' },
    // Peanut Butter — Crunchy
    { id: 'PBC150', category: 'peanut_butter', name: 'Sweetnut Peanut Butter Crunchy 150g', icon: '🥜', price: 92,  size: '150g',  variety: 'crunchy' },
    { id: 'PBC250', category: 'peanut_butter', name: 'Sweetnut Peanut Butter Crunchy 250g', icon: '🥜', price: 148,  size: '250g',  variety: 'crunchy' },
    { id: 'PBC400', category: 'peanut_butter', name: 'Sweetnut Peanut Butter Crunchy 400g', icon: '🥜', price: 224,  size: '400g',  variety: 'crunchy' },
    { id: 'PBC800', category: 'peanut_butter', name: 'Sweetnut Peanut Butter Crunchy 800g', icon: '🥜', price: 412,  size: '800g',  variety: 'crunchy' },
    // Peanuts
    { id: 'PN50',  category: 'peanuts',      name: 'Sweetnut Roasted Peanuts 50g',       icon: '🫘', price: 35,   size: '50g',   variety: null },
    { id: 'PN100', category: 'peanuts',      name: 'Sweetnut Roasted Peanuts 100g',      icon: '🫘', price: 54,  size: '100g',  variety: null },
    { id: 'PN200', category: 'peanuts',      name: 'Sweetnut Roasted Peanuts 200g',      icon: '🫘', price: 98,  size: '200g',  variety: null },
  ],

  getProduct(id) { return this.PRODUCTS.find(p => p.id === id); },

  // ---- Stock ----
  getStock() {
    const s = this.load('stock', {});
    const result = {};
    this.PRODUCTS.forEach(p => {
      result[p.id] = s[p.id] !== undefined ? s[p.id] : 50;
    });
    return result;
  },
  updateStock(id, qty) {
    const s = this.getStock();
    s[id] = Math.max(0, (s[id] || 0) + qty);
    this.save('stock', s);
  },
  setStock(id, qty) {
    const s = this.getStock();
    s[id] = Math.max(0, qty);
    this.save('stock', s);
  },

  // ---- Customers ----
  getCustomers() { return this.load('customers', []); },
  saveCustomers(list) { this.save('customers', list); },
  getCustomer(id) { return this.getCustomers().find(c => c.id === id); },
  addCustomer(data) {
    const list = this.getCustomers();
    const c = { id: 'C' + Date.now(), createdAt: new Date().toISOString(), ...data };
    list.push(c);
    this.saveCustomers(list);
    return c;
  },
  updateCustomer(id, data) {
    const list = this.getCustomers();
    const i = list.findIndex(c => c.id === id);
    if (i > -1) { list[i] = { ...list[i], ...data }; this.saveCustomers(list); }
  },

  // ---- Orders ----
  getOrders() { return this.load('orders', []); },
  saveOrders(list) { this.save('orders', list); },
  getOrder(id) { return this.getOrders().find(o => o.id === id); },
  addOrder(data) {
    const list = this.getOrders();
    const id = 'ORD-' + String(list.length + 1).padStart(4, '0');
    const order = {
      id,
      date: new Date().toISOString(),
      status: 'pending',
      paymentStatus: 'unpaid',
      amountPaid: 0,
      ...data
    };
    // Deduct stock
    order.items.forEach(item => this.updateStock(item.productId, -item.qty));
    list.push(order);
    this.saveOrders(list);
    return order;
  },
  updateOrder(id, data) {
    const list = this.getOrders();
    const i = list.findIndex(o => o.id === id);
    if (i > -1) { list[i] = { ...list[i], ...data }; this.saveOrders(list); return list[i]; }
  renameOrder(oldId, newId) {
  if (!newId || newId === oldId) return { ok: false, msg: 'No change.' };
  const orders = this.getOrders();
  if (orders.find(o => o.id === newId)) return { ok: false, msg: 'That order ID is already in use.' };
  const idx = orders.findIndex(o => o.id === oldId);
  if (idx === -1) return { ok: false, msg: 'Order not found.' };

  orders[idx].id = newId;
  this.saveOrders(orders);

  const payments = this.getPayments();
  payments.forEach(p => { if (p.orderId === oldId) p.orderId = newId; });
  this.savePayments(payments);

  const cns = this.getCreditNotes();
  cns.forEach(cn => { if (cn.orderId === oldId) cn.orderId = newId; });
  this.saveCreditNotes(cns);

  return { ok: true };
  },

  // ---- Payments ----
  getPayments() { return this.load('payments', []); },
  savePayments(list) { this.save('payments', list); },
  addPayment(data) {
    const list = this.getPayments();
    const payment = {
      id: 'PAY-' + String(list.length + 1).padStart(4, '0'),
      date: new Date().toISOString(),
      ...data
    };
    list.push(payment);
    this.savePayments(list);
    // Update order payment status
    const order = this.getOrder(data.orderId);
    if (order) {
      const totalPaid = (order.amountPaid || 0) + data.amount;
      const status = totalPaid >= order.total ? 'paid'
        : totalPaid > 0 ? 'partial' : 'unpaid';
      this.updateOrder(data.orderId, { amountPaid: totalPaid, paymentStatus: status });
    }
    return payment;
  },
  getOrderPayments(orderId) {
    return this.getPayments().filter(p => p.orderId === orderId);
  },

  // ---- Credit Notes ----
  getCreditNotes() { return this.load('creditnotes', []); },
  saveCreditNotes(list) { this.save('creditnotes', list); },
  addCreditNote(data) {
    const list = this.getCreditNotes();
    const cn = {
      id: 'CN-' + String(list.length + 1).padStart(4, '0'),
      date: new Date().toISOString(),
      ...data
    };
    list.push(cn);
    this.saveCreditNotes(list);
    return cn;
  },

  // ---- Helpers ----
  fmtDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-KE', { day:'2-digit', month:'short', year:'numeric' });
  },
  fmtMoney(n) {
    return 'KES ' + Number(n || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  },
  calcOrderTotal(items) {
    return items.reduce((s, i) => s + (i.qty * i.unitPrice), 0);
  },

  // ---- Analytics ----
  getSalesByMonth() {
    const orders = this.getOrders();
    const months = {};
    orders.forEach(o => {
      const m = new Date(o.date).toLocaleString('en', { month: 'short', year: '2-digit' });
      months[m] = (months[m] || 0) + o.total;
    });
    return months;
  },
  getSalesByProduct() {
    const orders = this.getOrders();
    const byProd = {};
    orders.forEach(o => {
      o.items.forEach(item => {
        byProd[item.productId] = (byProd[item.productId] || 0) + item.qty * item.unitPrice;
      });
    });
    return byProd;
  },
  getOutstandingCustomers() {
    const orders = this.getOrders();
    const map = {};
    orders.forEach(o => {
      if (o.paymentStatus !== 'paid') {
        const bal = o.total - (o.amountPaid || 0);
        if (!map[o.customerId]) map[o.customerId] = { customerId: o.customerId, balance: 0, orders: [] };
        map[o.customerId].balance += bal;
        map[o.customerId].orders.push(o.id);
      }
    });
    return Object.values(map);
  },
};

// Seed some demo data if empty
(function seedDemo() {
  if (DB.getCustomers().length > 0) return;
  const customers = [
   
  ];
  customers.forEach(c => DB.addCustomer(c));

  const custs = DB.getCustomers();
  const sampleOrders = [
    
  ];

  sampleOrders.forEach(o => {
    const total = DB.calcOrderTotal(o.items);
    const order = DB.addOrder({ ...o, total, notes: 'Sample order' });
    // Pay some partially
    const payAmt = Math.round(total * (Math.random() * 0.6 + 0.2));
    DB.addPayment({ orderId: order.id, amount: payAmt, method: 'M-Pesa', reference: 'QDK' + Math.random().toString(36).slice(2,8).toUpperCase() });
  });
})();
