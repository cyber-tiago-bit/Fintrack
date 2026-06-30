// FinTrack — frontend JS
const API = '';
let token = localStorage.getItem('fintrack_token');
let currentUser = JSON.parse(localStorage.getItem('fintrack_user') || 'null');
let currentMonth = new Date().getMonth() + 1;
let currentYear = new Date().getFullYear();
let allCategories = [];
let pieChart = null, barChart = null;

async function apiFetch(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(API + path, { ...opts, headers: { ...headers, ...(opts.headers || {}) } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || 'Erro na requisicao.');
  return data;
}

function toast(msg, type = 'success') {
  const container = document.getElementById('toastContainer');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<i class="ti ${type === 'success' ? 'ti-check' : 'ti-alert-circle'}"></i> ${msg}`;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

function showAuth() {
  document.getElementById('authScreen').classList.remove('hidden');
  document.getElementById('appScreen').classList.add('hidden');
}
function showApp() {
  document.getElementById('authScreen').classList.add('hidden');
  document.getElementById('appScreen').classList.remove('hidden');
  document.getElementById('sidebarUserName').textContent = currentUser?.name || '';
  document.getElementById('sidebarUserEmail').textContent = currentUser?.email || '';
  loadCategories().then(() => navigateTo('dashboard'));
}

function switchAuthTab(tab) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  document.getElementById(`tab-${tab}`).classList.add('active');
  document.getElementById('formLogin').classList.toggle('hidden', tab !== 'login');
  document.getElementById('formRegister').classList.toggle('hidden', tab !== 'register');
}

async function doLogin(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button');
  btn.textContent = 'Entrando...'; btn.disabled = true;
  try {
    const data = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: document.getElementById('loginEmail').value, password: document.getElementById('loginPassword').value })
    });
    token = data.access_token; currentUser = data.user;
    localStorage.setItem('fintrack_token', token);
    localStorage.setItem('fintrack_user', JSON.stringify(currentUser));
    showApp();
  } catch (err) { toast(err.message, 'error'); }
  finally { btn.textContent = 'Entrar'; btn.disabled = false; }
}

async function doRegister(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button');
  btn.textContent = 'Criando conta...'; btn.disabled = true;
  try {
    const data = await apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: document.getElementById('regName').value,
        email: document.getElementById('regEmail').value,
        password: document.getElementById('regPassword').value,
      })
    });
    token = data.access_token; currentUser = data.user;
    localStorage.setItem('fintrack_token', token);
    localStorage.setItem('fintrack_user', JSON.stringify(currentUser));
    toast('Conta criada com sucesso!');
    showApp();
  } catch (err) { toast(err.message, 'error'); }
  finally { btn.textContent = 'Criar conta'; btn.disabled = false; }
}

function doLogout() {
  token = null; currentUser = null;
  localStorage.removeItem('fintrack_token');
  localStorage.removeItem('fintrack_user');
  showAuth();
}

function navigateTo(page) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.getElementById(`nav-${page}`)?.classList.add('active');
  document.getElementById(`page-${page}`)?.classList.remove('hidden');
  if (page === 'dashboard') loadDashboard();
  if (page === 'transactions') loadTransactions();
  if (page === 'categories') loadCategoriesPage();
  if (page === 'budgets') loadBudgetsPage();
  if (page === 'recurring') loadRecurringPage();
  if (page === 'goals') loadGoalsPage();
  if (page === 'accounts') loadAccountsPage();
}

function updateMonthDisplay() {
  const label = new Date(currentYear, currentMonth - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  document.querySelectorAll('.monthDisplay').forEach(el => el.textContent = label.charAt(0).toUpperCase() + label.slice(1));
}
function prevMonth() {
  currentMonth--; if (currentMonth < 1) { currentMonth = 12; currentYear--; }
  updateMonthDisplay(); loadDashboard();
}
function nextMonth() {
  currentMonth++; if (currentMonth > 12) { currentMonth = 1; currentYear++; }
  updateMonthDisplay(); loadDashboard();
}

async function loadDashboard() {
  try {
    const data = await apiFetch(`/api/transactions/dashboard/summary?month=${currentMonth}&year=${currentYear}`);
    document.getElementById('totalIncome').textContent = fmtMoney(data.total_income);
    document.getElementById('totalExpense').textContent = fmtMoney(data.total_expense);
    const balEl = document.getElementById('totalBalance');
    balEl.textContent = fmtMoney(data.balance);
    balEl.className = 'metric-value ' + (data.balance >= 0 ? 'positive' : 'negative');
    renderPieChart(data.expense_by_category);
    renderBarChart(data.monthly_flow);
    await loadRecentTransactions();
  } catch (err) { toast('Erro ao carregar dashboard.', 'error'); }
}

function renderPieChart(cats) {
  if (pieChart) pieChart.destroy();
  const ctx = document.getElementById('pieChart').getContext('2d');
  if (!cats.length) { ctx.clearRect(0,0,300,200); return; }
  pieChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: cats.map(c => c.name),
      datasets: [{ data: cats.map(c => c.total), backgroundColor: cats.map(c => c.color), borderWidth: 2, borderColor: '#fff' }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '65%',
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => `${ctx.label}: ${fmtMoney(ctx.raw)}` } } }
    }
  });
  const legend = document.getElementById('pieLegend');
  legend.innerHTML = cats.slice(0,6).map(c =>
    `<span style="display:flex;align-items:center;gap:4px;font-size:11px;color:#6b7280;">
      <span style="width:9px;height:9px;border-radius:2px;background:${c.color};display:inline-block;"></span>${c.name}
    </span>`
  ).join('');
}

function renderBarChart(flow) {
  if (barChart) barChart.destroy();
  const ctx = document.getElementById('barChart').getContext('2d');
  const months = [...new Set(flow.map(f => f.month))].sort();
  const labels = months.map(m => new Date(currentYear, m-1).toLocaleDateString('pt-BR', {month:'short'}));
  const income = months.map(m => flow.find(f=>f.month===m&&f.type==='income')?.total||0);
  const expense = months.map(m => flow.find(f=>f.month===m&&f.type==='expense')?.total||0);
  barChart = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [
      { label: 'Entradas', data: income, backgroundColor: '#10b981', borderRadius: 4 },
      { label: 'Saidas', data: expense, backgroundColor: '#ef4444', borderRadius: 4 }
    ]},
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: { y: { ticks: { callback: v => 'R$' + (v/1000).toFixed(0) + 'k', color:'#9ca3af' }, grid: { color:'#f3f4f6' } }, x: { ticks: { color:'#9ca3af' }, grid: { display: false } } },
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${fmtMoney(ctx.raw)}` } } }
    }
  });
}

async function loadRecentTransactions() {
  const list = document.getElementById('recentList');
  const txs = await apiFetch(`/api/transactions/?month=${currentMonth}&year=${currentYear}`);
  if (!txs.length) { list.innerHTML = '<div class="empty-state"><i class="ti ti-inbox"></i><p>Nenhum lancamento neste mes.</p></div>'; return; }
  list.innerHTML = txs.slice(0,7).map(tx => txItem(tx)).join('');
}

async function loadTransactions() {
  const type = document.getElementById('filterType').value;
  const cat = document.getElementById('filterCat').value;
  const month = document.getElementById('filterMonth').value;
  let url = `/api/transactions/?year=${currentYear}`;
  if (type !== 'all') url += `&type=${type}`;
  if (cat !== 'all') url += `&category_id=${cat}`;
  if (month !== 'all') url += `&month=${month}`;
  const txs = await apiFetch(url);
  const list = document.getElementById('txList');
  if (!txs.length) { list.innerHTML = '<div class="empty-state"><i class="ti ti-inbox"></i><p>Nenhum lancamento encontrado.</p></div>'; return; }
  list.innerHTML = txs.map(tx => txItem(tx, true)).join('');
}

function txItem(tx, showDelete = false) {
  const color = tx.category?.color || '#898781';
  const icon = tx.category?.icon || 'ti-tag';
  return `<div class="tx-item">
    <div class="tx-dot" style="background:${color}20;">
      <i class="ti ${icon}" style="color:${color};font-size:16px;"></i>
    </div>
    <div class="tx-info">
      <div class="tx-desc">${tx.description}</div>
      <div class="tx-meta">${tx.category?.name || ''} · ${fmtDate(tx.date)} · ${tx.payment_method}${tx.note ? ' · ' + tx.note : ''}</div>
    </div>
    <div class="tx-right">
      <div class="tx-amount ${tx.type}">${tx.type === 'income' ? '+' : '-'}${fmtMoney(tx.amount)}</div>
      ${showDelete ? `<button class="btn-danger" style="margin-top:4px;" onclick="deleteTransaction(${tx.id})"><i class="ti ti-trash"></i></button>` : ''}
    </div>
  </div>`;
}

async function deleteTransaction(id) {
  if (!confirm('Excluir este lancamento?')) return;
  try {
    await apiFetch(`/api/transactions/${id}`, { method: 'DELETE' });
    toast('Lancamento excluido.');
    loadTransactions(); loadDashboard();
  } catch (err) { toast(err.message, 'error'); }
}

function openNewTransaction(defaultType = 'expense') {
  document.getElementById('txModal').classList.remove('hidden');
  document.getElementById('txDate').value = new Date().toISOString().split('T')[0];
  setTxType(defaultType);
}
function closeTxModal() {
  document.getElementById('txModal').classList.add('hidden');
  document.getElementById('txForm').reset();
}
function setTxType(type) {
  document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`typeBtn-${type}`).classList.add('active', type);
  document.getElementById('txTypeHidden').value = type;
  renderCatSelect(type);
}
function renderCatSelect(type) {
  const sel = document.getElementById('txCatSelect');
  const cats = allCategories.filter(c => c.type === type);
  sel.innerHTML = cats.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
}

async function submitTransaction(e) {
  e.preventDefault();
  const btn = e.target.querySelector('.btn-primary');
  btn.disabled = true; btn.textContent = 'Salvando...';
  try {
    await apiFetch('/api/transactions/', {
      method: 'POST',
      body: JSON.stringify({
        description: document.getElementById('txDesc').value,
        amount: parseFloat(document.getElementById('txAmount').value),
        type: document.getElementById('txTypeHidden').value,
        date: document.getElementById('txDate').value,
        payment_method: document.getElementById('txPayMethod').value,
        note: document.getElementById('txNote').value || null,
        category_id: parseInt(document.getElementById('txCatSelect').value),
      })
    });
    toast('Lancamento salvo!');
    closeTxModal();
    loadDashboard();
    if (!document.getElementById('page-transactions').classList.contains('hidden')) loadTransactions();
  } catch (err) { toast(err.message, 'error'); }
  finally { btn.disabled = false; btn.textContent = 'Salvar'; }
}

async function loadCategories() {
  allCategories = await apiFetch('/api/categories/');
  const catSel = document.getElementById('filterCat');
  if (catSel) catSel.innerHTML = '<option value="all">Todas as categorias</option>' + allCategories.map(c=>`<option value="${c.id}">${c.name}</option>`).join('');
}

async function loadCategoriesPage() {
  const data = await apiFetch(`/api/transactions/dashboard/summary?month=${currentMonth}&year=${currentYear}`);
  const grid = document.getElementById('catGrid');
  const cats = data.expense_by_category;
  const total = cats.reduce((a, c) => a + c.total, 0);
  if (!cats.length) { grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><i class="ti ti-inbox"></i><p>Nenhuma despesa neste mes.</p></div>'; return; }
  grid.innerHTML = cats.map(c => {
    const pct = total > 0 ? Math.round((c.total / total) * 100) : 0;
    return `<div class="cat-row">
      <div class="cat-row-header">
        <div class="cat-name"><i class="ti ${c.icon}" style="color:${c.color}"></i>${c.name}</div>
        <div><span class="cat-value">${fmtMoney(c.total)}</span> <span class="cat-pct">${pct}%</span></div>
      </div>
      <div class="progress"><div class="progress-fill" style="width:${pct}%;background:${c.color};"></div></div>
    </div>`;
  }).join('');
}

function populateMonthDropdown() {
  const sel = document.getElementById('filterMonth');
  const months = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(currentYear, i);
    months.push({ value: i+1, label: d.toLocaleDateString('pt-BR', {month:'long'}) });
  }
  sel.innerHTML = '<option value="all">Todos os meses</option>' + months.map(m=>`<option value="${m.value}" ${m.value===currentMonth?'selected':''}>${m.label}</option>`).join('');
}

function fmtMoney(v) { return 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtDate(d) { return new Date(d + 'T12:00').toLocaleDateString('pt-BR'); }

async function loadBudgetsPage() {
  const grid = document.getElementById('budgetGrid');
  grid.innerHTML = '<p style="color:var(--text-3)">Carregando...</p>';
  const budgets = await apiFetch(`/api/budgets/?month=${currentMonth}&year=${currentYear}`);
  if (!budgets.length) {
    grid.innerHTML = '<div class="empty-state"><i class="ti ti-target"></i><p>Nenhuma meta definida para este mes.</p></div>';
    return;
  }
  grid.innerHTML = budgets.map(b => {
    const pct = Math.min(b.percentage, 100);
    const color = b.status === 'exceeded' ? '#dc2626' : b.status === 'warning' ? '#f59e0b' : '#059669';
    return `<div class="card" style="margin-bottom:0">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <div style="display:flex;align-items:center;gap:8px;">
          <div style="width:34px;height:34px;border-radius:8px;background:${b.category.color}20;display:flex;align-items:center;justify-content:center;">
            <i class="ti ${b.category.icon}" style="color:${b.category.color};font-size:16px;"></i>
          </div>
          <div>
            <div style="font-weight:500;font-size:14px;">${b.category.name}</div>
            <div style="font-size:11px;color:var(--text-3)">Meta: ${fmtMoney(b.amount)}</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <div style="text-align:right;">
            <div style="font-size:13px;font-weight:600;color:${color}">${b.percentage}%</div>
            <div style="font-size:11px;color:var(--text-3)">${fmtMoney(b.spent)} gastos</div>
          </div>
          <button class="btn-danger" onclick="deleteBudget(${b.id})"><i class="ti ti-trash"></i></button>
        </div>
      </div>
      <div class="progress">
        <div class="progress-fill" style="width:${pct}%;background:${color};"></div>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:6px;font-size:11px;color:var(--text-3);">
        <span>${b.status === 'exceeded' ? 'Meta ultrapassada!' : b.status === 'warning' ? 'Atencao: acima de 80%' : 'Dentro da meta'}</span>
        <span>Restante: ${fmtMoney(b.remaining)}</span>
      </div>
    </div>`;
  }).join('');
}

function openNewBudget() {
  document.getElementById('budgetModal').classList.remove('hidden');
  document.getElementById('budgetMonth').value = currentMonth;
  document.getElementById('budgetYear').value = currentYear;
  const cats = allCategories.filter(c => c.type === 'expense');
  document.getElementById('budgetCat').innerHTML = cats.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
}

function closeBudgetModal() {
  document.getElementById('budgetModal').classList.add('hidden');
  document.getElementById('budgetForm').reset();
}

async function submitBudget(e) {
  e.preventDefault();
  const btn = e.target.querySelector('.btn-primary');
  btn.disabled = true; btn.textContent = 'Salvando...';
  try {
    await apiFetch('/api/budgets/', {
      method: 'POST',
      body: JSON.stringify({
        amount: parseFloat(document.getElementById('budgetAmount').value),
        month: parseInt(document.getElementById('budgetMonth').value),
        year: parseInt(document.getElementById('budgetYear').value),
        category_id: parseInt(document.getElementById('budgetCat').value),
      })
    });
    toast('Meta criada!');
    closeBudgetModal();
    loadBudgetsPage();
  } catch (err) { toast(err.message, 'error'); }
  finally { btn.disabled = false; btn.textContent = 'Salvar'; }
}

async function deleteBudget(id) {
  if (!confirm('Excluir esta meta?')) return;
  await apiFetch(`/api/budgets/${id}`, { method: 'DELETE' });
  toast('Meta excluida.');
  loadBudgetsPage();
}

document.addEventListener('DOMContentLoaded', () => {
  updateMonthDisplay();
  populateMonthDropdown();
  if (token && currentUser) {
    showApp();
  } else {
    showAuth();
  }
});
function exportarCSV() {
  const type = document.getElementById('filterType').value;
  const month = document.getElementById('filterMonth').value;
  let url = `/api/transactions/?year=${currentYear}`;
  if (type !== 'all') url += `&type=${type}`;
  if (month !== 'all') url += `&month=${month}`;

  apiFetch(url).then(txs => {
    if (!txs.length) { toast('Nenhum lancamento para exportar.', 'error'); return; }

    const header = ['Data', 'Descricao', 'Tipo', 'Categoria', 'Valor', 'Forma de Pagamento', 'Observacao'];
    const rows = txs.map(tx => [
      fmtDate(tx.date),
      tx.description,
      tx.type === 'income' ? 'Entrada' : 'Saida',
      tx.category?.name || '',
      tx.amount.toFixed(2).replace('.', ','),
      tx.payment_method,
      tx.note || ''
    ]);

    const csv = [header, ...rows].map(r => r.map(c => `"${c}"`).join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `fintrack_${currentYear}_${String(currentMonth).padStart(2,'0')}.csv`;
    link.click();
    toast('Exportado com sucesso!');
  });
}
// ── RECURRING ────────────────────────────────────────────────────────────────
async function loadRecurringPage() {
  const list = document.getElementById('recurringList');
  list.innerHTML = '<p style="color:var(--text-3)">Carregando...</p>';
  const items = await apiFetch('/api/recurring/');
  if (!items.length) {
    list.innerHTML = '<div class="empty-state"><i class="ti ti-repeat"></i><p>Nenhum lancamento recorrente cadastrado.<br>Clique em "Novo recorrente" para comecar.</p></div>';
    return;
  }
  const freqLabel = { monthly: 'Mensal', weekly: 'Semanal', yearly: 'Anual' };
  list.innerHTML = items.map(r => {
    const color = r.category?.color || '#898781';
    const icon = r.category?.icon || 'ti-tag';
    return `<div class="tx-item">
      <div class="tx-dot" style="background:${color}20;">
        <i class="ti ${icon}" style="color:${color};font-size:16px;"></i>
      </div>
      <div class="tx-info">
        <div class="tx-desc">${r.description} <span class="badge ${r.type === 'income' ? 'badge-income' : 'badge-expense'}">${r.type === 'income' ? 'Entrada' : 'Saida'}</span></div>
        <div class="tx-meta">${r.category?.name || ''} · ${freqLabel[r.frequency] || r.frequency} · desde ${fmtDate(r.start_date)}</div>
      </div>
      <div class="tx-right" style="display:flex;align-items:center;gap:8px;">
        <div>
          <div class="tx-amount ${r.type}">${r.type === 'income' ? '+' : '-'}${fmtMoney(r.amount)}</div>
          <div style="font-size:11px;color:var(--text-3);text-align:right;">${r.active ? 'Ativo' : 'Inativo'}</div>
        </div>
        <button class="btn btn-ghost" style="font-size:12px;padding:5px 8px;" onclick="gerarLancamento(${r.id})" title="Gerar lancamento hoje">
          <i class="ti ti-player-play"></i>
        </button>
        <button class="btn-danger" onclick="deleteRecurring(${r.id})">
          <i class="ti ti-trash"></i>
        </button>
      </div>
    </div>`;
  }).join('');
}

function openNewRecurring() {
  document.getElementById('recurringModal').classList.remove('hidden');
  document.getElementById('recurringDate').value = new Date().toISOString().split('T')[0];
  setRecurringType('expense');
}

function closeRecurringModal() {
  document.getElementById('recurringModal').classList.add('hidden');
  document.getElementById('recurringForm').reset();
}

function setRecurringType(type) {
  document.querySelectorAll('.rec-type-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`recTypeBtn-${type}`).classList.add('active', type);
  document.getElementById('recurringTypeHidden').value = type;
  const cats = allCategories.filter(c => c.type === type);
  document.getElementById('recurringCat').innerHTML = cats.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
}

async function submitRecurring(e) {
  e.preventDefault();
  const btn = e.target.querySelector('.btn-primary');
  btn.disabled = true; btn.textContent = 'Salvando...';
  try {
    await apiFetch('/api/recurring/', {
      method: 'POST',
      body: JSON.stringify({
        description: document.getElementById('recurringDesc').value,
        amount: parseFloat(document.getElementById('recurringAmount').value),
        type: document.getElementById('recurringTypeHidden').value,
        frequency: document.getElementById('recurringFreq').value,
        start_date: document.getElementById('recurringDate').value,
        payment_method: document.getElementById('recurringPayMethod').value,
        note: document.getElementById('recurringNote').value || null,
        category_id: parseInt(document.getElementById('recurringCat').value),
      })
    });
    toast('Recorrente criado!');
    closeRecurringModal();
    loadRecurringPage();
  } catch (err) { toast(err.message, 'error'); }
  finally { btn.disabled = false; btn.textContent = 'Salvar'; }
}

async function gerarLancamento(id) {
  if (!confirm('Gerar um lancamento para hoje com base neste recorrente?')) return;
  try {
    await apiFetch(`/api/recurring/${id}/gerar`, { method: 'POST' });
    toast('Lancamento gerado com sucesso!');
    loadDashboard();
  } catch (err) { toast(err.message, 'error'); }
}

async function deleteRecurring(id) {
  if (!confirm('Excluir este recorrente?')) return;
  await apiFetch(`/api/recurring/${id}`, { method: 'DELETE' });
  toast('Recorrente excluido.');
  loadRecurringPage();
}
// ── GOALS ────────────────────────────────────────────────────────────────────
async function loadGoalsPage() {
  const grid = document.getElementById('goalsGrid');
  grid.innerHTML = '<p style="color:var(--text-3)">Carregando...</p>';
  const goals = await apiFetch('/api/goals/');
  if (!goals.length) {
    grid.innerHTML = '<div class="empty-state"><i class="ti ti-star"></i><p>Nenhum objetivo cadastrado.<br>Clique em "Novo objetivo" para comecar.</p></div>';
    return;
  }
  grid.innerHTML = goals.map(g => {
    const pct = Math.min(g.percentage, 100);
    const concluido = g.percentage >= 100;
    return `<div class="card" style="margin-bottom:0">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="width:40px;height:40px;border-radius:10px;background:${g.color}20;display:flex;align-items:center;justify-content:center;">
            <i class="ti ${g.icon}" style="color:${g.color};font-size:20px;"></i>
          </div>
          <div>
            <div style="font-weight:600;font-size:15px;">${g.name}</div>
            ${g.description ? `<div style="font-size:11px;color:var(--text-3)">${g.description}</div>` : ''}
          </div>
        </div>
        <button class="btn-danger" onclick="deleteGoal(${g.id})"><i class="ti ti-trash"></i></button>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
        <span style="font-size:13px;color:var(--text-2)">Guardado: <strong>${fmtMoney(g.current_amount)}</strong></span>
        <span style="font-size:13px;color:var(--text-2)">Meta: <strong>${fmtMoney(g.target_amount)}</strong></span>
      </div>
      <div class="progress" style="height:8px;">
        <div class="progress-fill" style="width:${pct}%;background:${concluido ? '#16a34a' : g.color};"></div>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:6px;font-size:11px;color:var(--text-3);">
        <span>${concluido ? '🎉 Objetivo concluido!' : `Faltam ${fmtMoney(g.remaining)}`}</span>
        <span>${g.percentage}%${g.deadline ? ` · Prazo: ${fmtDate(g.deadline)}` : ''}</span>
      </div>
      ${!concluido ? `
      <button class="btn btn-ghost" style="width:100%;margin-top:10px;font-size:13px;" onclick="openDeposit(${g.id}, '${g.name}')">
        <i class="ti ti-plus"></i> Adicionar valor
      </button>` : ''}
    </div>`;
  }).join('');
}

function openNewGoal() {
  document.getElementById('goalModal').classList.remove('hidden');
}

function closeGoalModal() {
  document.getElementById('goalModal').classList.add('hidden');
  document.getElementById('goalForm').reset();
}

async function submitGoal(e) {
  e.preventDefault();
  const btn = e.target.querySelector('.btn-primary');
  btn.disabled = true; btn.textContent = 'Salvando...';
  try {
    await apiFetch('/api/goals/', {
      method: 'POST',
      body: JSON.stringify({
        name: document.getElementById('goalName').value,
        description: document.getElementById('goalDesc').value || null,
        target_amount: parseFloat(document.getElementById('goalAmount').value),
        deadline: document.getElementById('goalDeadline').value || null,
        icon: document.getElementById('goalIcon').value,
        color: document.getElementById('goalColor').value,
      })
    });
    toast('Objetivo criado!');
    closeGoalModal();
    loadGoalsPage();
  } catch (err) { toast(err.message, 'error'); }
  finally { btn.disabled = false; btn.textContent = 'Salvar'; }
}

function openDeposit(id, name) {
  document.getElementById('depositGoalId').value = id;
  document.getElementById('depositTitle').textContent = `Adicionar valor — ${name}`;
  document.getElementById('depositModal').classList.remove('hidden');
}

function closeDepositModal() {
  document.getElementById('depositModal').classList.add('hidden');
  document.getElementById('depositForm').reset();
}

async function submitDeposit(e) {
  e.preventDefault();
  const btn = e.target.querySelector('.btn-primary');
  btn.disabled = true; btn.textContent = 'Salvando...';
  const id = document.getElementById('depositGoalId').value;
  try {
    await apiFetch(`/api/goals/${id}/depositar`, {
      method: 'POST',
      body: JSON.stringify({ amount: parseFloat(document.getElementById('depositAmount').value) })
    });
    toast('Valor adicionado!');
    closeDepositModal();
    loadGoalsPage();
  } catch (err) { toast(err.message, 'error'); }
  finally { btn.disabled = false; btn.textContent = 'Confirmar'; }
}

async function deleteGoal(id) {
  if (!confirm('Excluir este objetivo?')) return;
  await apiFetch(`/api/goals/${id}`, { method: 'DELETE' });
  toast('Objetivo excluido.');
  loadGoalsPage();
}
// ── ACCOUNTS ─────────────────────────────────────────────────────────────────
async function loadAccountsPage() {
  const grid = document.getElementById('accountsGrid');
  grid.innerHTML = '<p style="color:var(--text-3)">Carregando...</p>';
  const accounts = await apiFetch('/api/accounts/');
  if (!accounts.length) {
    grid.innerHTML = '<div class="empty-state"><i class="ti ti-wallet"></i><p>Nenhuma conta cadastrada.<br>Clique em "Nova conta" para comecar.</p></div>';
    return;
  }
  const total = accounts.reduce((a, c) => a + c.balance, 0);
  grid.innerHTML = `
    <div class="card" style="grid-column:1/-1;background:linear-gradient(135deg,#1e3a5f,#1e40af);color:#fff;border:none;">
      <div style="font-size:12px;opacity:0.8;margin-bottom:4px;">Saldo total em todas as contas</div>
      <div style="font-size:28px;font-weight:600;">${fmtMoney(total)}</div>
    </div>
    ${accounts.map(a => `
    <div class="card" style="margin-bottom:0">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="width:42px;height:42px;border-radius:10px;background:${a.color}20;display:flex;align-items:center;justify-content:center;">
            <i class="ti ${a.icon}" style="color:${a.color};font-size:20px;"></i>
          </div>
          <div>
            <div style="font-weight:600;font-size:15px;">${a.name}</div>
            <div style="font-size:11px;color:var(--text-3)">${a.type}</div>
          </div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:18px;font-weight:600;color:${a.balance >= 0 ? '#16a34a' : '#dc2626'}">${fmtMoney(a.balance)}</div>
          <div style="display:flex;gap:6px;margin-top:4px;">
            <button class="btn btn-ghost" style="font-size:11px;padding:4px 8px;" onclick="openAjuste(${a.id}, '${a.name}')">
              <i class="ti ti-adjustments"></i> Ajustar
            </button>
            <button class="btn-danger" onclick="deleteAccount(${a.id})"><i class="ti ti-trash"></i></button>
          </div>
        </div>
      </div>
    </div>`).join('')}
    <div class="card" style="margin-bottom:0;border:2px dashed var(--border);background:transparent;display:flex;align-items:center;justify-content:center;cursor:pointer;min-height:80px;" onclick="openTransfer()">
      <div style="text-align:center;color:var(--text-3);">
        <i class="ti ti-transfer" style="font-size:24px;"></i>
        <div style="font-size:13px;margin-top:4px;">Transferir entre contas</div>
      </div>
    </div>
  `;
}

function openNewAccount() {
  document.getElementById('accountModal').classList.remove('hidden');
}

function closeAccountModal() {
  document.getElementById('accountModal').classList.add('hidden');
  document.getElementById('accountForm').reset();
}

async function submitAccount(e) {
  e.preventDefault();
  const btn = e.target.querySelector('.btn-primary');
  btn.disabled = true; btn.textContent = 'Salvando...';
  try {
    await apiFetch('/api/accounts/', {
      method: 'POST',
      body: JSON.stringify({
        name: document.getElementById('accountName').value,
        type: document.getElementById('accountType').value,
        balance: parseFloat(document.getElementById('accountBalance').value || 0),
        color: document.getElementById('accountColor').value,
        icon: document.getElementById('accountIcon').value,
      })
    });
    toast('Conta criada!');
    closeAccountModal();
    loadAccountsPage();
  } catch (err) { toast(err.message, 'error'); }
  finally { btn.disabled = false; btn.textContent = 'Salvar'; }
}

function openAjuste(id, name) {
  document.getElementById('ajusteAccountId').value = id;
  document.getElementById('ajusteTitle').textContent = `Ajustar saldo — ${name}`;
  document.getElementById('ajusteModal').classList.remove('hidden');
}

function closeAjusteModal() {
  document.getElementById('ajusteModal').classList.add('hidden');
  document.getElementById('ajusteForm').reset();
}

async function submitAjuste(e) {
  e.preventDefault();
  const btn = e.target.querySelector('.btn-primary');
  btn.disabled = true; btn.textContent = 'Salvando...';
  const id = document.getElementById('ajusteAccountId').value;
  try {
    await apiFetch(`/api/accounts/${id}/ajustar`, {
      method: 'POST',
      body: JSON.stringify({ amount: parseFloat(document.getElementById('ajusteAmount').value) })
    });
    toast('Saldo ajustado!');
    closeAjusteModal();
    loadAccountsPage();
  } catch (err) { toast(err.message, 'error'); }
  finally { btn.disabled = false; btn.textContent = 'Confirmar'; }
}

function openTransfer() {
  document.getElementById('transferModal').classList.remove('hidden');
  apiFetch('/api/accounts/').then(accounts => {
    const opts = accounts.map(a => `<option value="${a.id}">${a.name} (${fmtMoney(a.balance)})</option>`).join('');
    document.getElementById('transferFrom').innerHTML = opts;
    document.getElementById('transferTo').innerHTML = opts;
  });
}

function closeTransferModal() {
  document.getElementById('transferModal').classList.add('hidden');
  document.getElementById('transferForm').reset();
}

async function submitTransfer(e) {
  e.preventDefault();
  const btn = e.target.querySelector('.btn-primary');
  btn.disabled = true; btn.textContent = 'Transferindo...';
  try {
    await apiFetch('/api/accounts/transferir', {
      method: 'POST',
      body: JSON.stringify({
        from_account_id: parseInt(document.getElementById('transferFrom').value),
        to_account_id: parseInt(document.getElementById('transferTo').value),
        amount: parseFloat(document.getElementById('transferAmount').value),
        description: document.getElementById('transferDesc').value || 'Transferencia entre contas',
      })
    });
    toast('Transferencia realizada!');
    closeTransferModal();
    loadAccountsPage();
  } catch (err) { toast(err.message, 'error'); }
  finally { btn.disabled = false; btn.textContent = 'Transferir'; }
}

async function deleteAccount(id) {
  if (!confirm('Excluir esta conta?')) return;
  await apiFetch(`/api/accounts/${id}`, { method: 'DELETE' });
  toast('Conta excluida.');
  loadAccountsPage();
}