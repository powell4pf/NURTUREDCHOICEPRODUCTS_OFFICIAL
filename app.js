// ============================================================
// NURTUREDCHOICE PRODUCTS — APP ENGINE
// ============================================================

const App = {
  currentPage: 'dashboard',

  init() {
    this.bindNav();
    this.bindModal();
    this.updateSidebarDate();
    this.render('dashboard');

    document.getElementById('quickSaleBtn').onclick = () => Pages.newOrderModal();
    document.getElementById('menuToggle').onclick = () => {
      document.getElementById('sidebar').classList.toggle('open');
    };
  },

  bindNav() {
    document.querySelectorAll('.nav-item').forEach(el => {
      el.onclick = () => {
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        el.classList.add('active');
        const page = el.dataset.page;
        this.currentPage = page;
        document.getElementById('pageTitle').textContent = el.textContent.trim();
        this.render(page);
        document.getElementById('sidebar').classList.remove('open');
      };
    });
  },

  bindModal() {
    document.getElementById('modalClose').onclick = () => this.closeModal();
    document.getElementById('modalOverlay').onclick = () => this.closeModal();
  },

  openModal(title, bodyHTML, wide = false) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = bodyHTML;
    document.getElementById('modal').classList.add('open');
    document.getElementById('modalOverlay').classList.add('open');
    if (wide) document.getElementById('modal').style.maxWidth = '860px';
    else document.getElementById('modal').style.maxWidth = '680px';
  },

  closeModal() {
    document.getElementById('modal').classList.remove('open');
    document.getElementById('modalOverlay').classList.remove('open');
    document.getElementById('modalBody').innerHTML = '';
  },

  render(page) {
    const content = document.getElementById('pageContent');
    const pages = {
      'dashboard': Pages.dashboard,
      'products': Pages.products,
      'customers': Pages.customers,
      'orders': Pages.orders,
      'payments': Pages.payments,
      'invoices': Pages.invoices,
      'credit-notes': Pages.creditNotes,
      'reports': Pages.reports,
    };
    content.innerHTML = '';
    if (pages[page]) pages[page]();
  },

  updateSidebarDate() {
    const d = new Date();
    document.getElementById('sidebarDate').textContent =
      d.toLocaleDateString('en-KE', { weekday:'short', day:'numeric', month:'short', year:'numeric' });
  },

  toast(msg, type = 'success') {
    const t = document.createElement('div');
    t.style.cssText = `position:fixed;bottom:28px;right:28px;z-index:9999;padding:12px 20px;border-radius:10px;
      font-size:.88rem;font-weight:600;color:#fff;box-shadow:0 4px 24px rgba(0,0,0,.2);
      background:${type === 'success' ? '#2E7D53' : type === 'error' ? '#C0392B' : '#C8820A'};
      animation:fadeIn .2s;`;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3200);
  }
};

// ============================================================
// PAGES
// ============================================================

const Pages = {
  // ... rest of methods unchanged ...

  invoices() {
    const orders = [...DB.getOrders()].sort((a,b) => new Date(b.date)-new Date(a.date));
    const content = document.getElementById('pageContent');
    content.innerHTML = `
      <div class="section-header">
        <div class="section-title">Invoices (${orders.length})</div>
      </div>
      <div class="card">
        <div class="table-wrapper">
          <table>
            <thead><tr>
              <th>Invoice #</th><th>Customer</th><th>Date</th><th>Amount</th><th>Status</th><th>Action</th>
            </tr></thead>
            <tbody>
              ${orders.map(o => {
                const c = DB.getCustomer(o.customerId);
                return `<tr>
                  <td class="text-mono">INV-${o.id.replace('ORD-','')}</td>
                  <td>${c?c.name:'—'}</td>
                  <td>${DB.fmtDate(o.date)}</td>
                  <td><strong>${DB.fmtMoney(o.total)}</strong></td>
                  <td>${Pages.payBadge(o.paymentStatus)}</td>
                  <td>
                    <button class="btn-ghost btn-xs" onclick="Pages.renameInvoiceModal('${o.id}')">✏️ Edit #</button>
                    <button class="btn-primary btn-xs" onclick="Pages.printInvoice('${o.id}')">🖨️ Print</button>
                    <button class="btn-secondary btn-xs" onclick="Pages.viewOrderModal('${o.id}')">View</button>
                  </td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  printInvoice(orderId) {
    const o = DB.getOrder(orderId);
    const c = DB.getCustomer(o.customerId);
    const balance = o.total - (o.amountPaid||0);
    const html = Pages.buildDocHTML('INVOICE', `INV-${orderId.replace('ORD-','')}`, o, c, balance);
    Pages.printDoc(html);
  },

  renameInvoiceModal(orderId) {
    const invNum = 'INV-' + orderId.replace('ORD-', '');
    App.openModal(`Rename Invoice — ${invNum}`, `
      <div class="alert alert-warning">
        ⚠️ Changing an invoice number also updates the linked order ID, payments, and any credit notes.
      </div>
      <div class="form-group">
        <label class="form-label">Current Invoice / Order ID</label>
        <input type="text" class="form-control" value="${orderId}" readonly style="background:#f5f0e8;font-family:'DM Mono',monospace">
      </div>
      <div class="form-group">
        <label class="form-label">New Order ID *</label>
        <input type="text" class="form-control" id="newOrderId"
          placeholder="e.g. ORD-0042"
          value="${orderId}"
          style="font-family:'DM Mono',monospace">
        <small class="text-muted">The invoice number shown on prints will be derived from this (e.g. ORD-0042 → INV-0042).</small>
      </div>
      <div class="modal-footer" style="padding:0;border:none;background:none;margin-top:16px">
        <button class="btn-secondary" onclick="App.closeModal()">Cancel</button>
        <button class="btn-primary" onclick="Pages.saveRenameInvoice('${orderId}')">Save New Number</button>
      </div>
    `);
  },

  saveRenameInvoice(oldId) {
    const newId = document.getElementById('newOrderId').value.trim();
    if (!newId) { App.toast('Please enter a new order ID', 'error'); return; }
    const result = DB.renameOrder(oldId, newId);
    if (!result.ok) { App.toast(result.msg, 'error'); return; }
    App.closeModal();
    App.toast(`Invoice renamed to INV-${newId.replace('ORD-', '')}!`);
    Pages.invoices();
  },

  // ...rest of Pages methods unchanged...
};

// ============================================================
// Boot
// ============================================================
document.addEventListener('DOMContentLoaded', () => App.init());
