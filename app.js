const screens = [...document.querySelectorAll('.screen')];
const dashboardContent = document.querySelector('#dashboard-content');
const systemModal = document.querySelector('#system-modal');
const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const dateFmt = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' });
const plans = [
  { id: 'mensal', name: 'Plano Mensal', months: 1, price: 129.90, color: '#ff7900' },
  { id: 'trimestral', name: 'Plano Trimestral', months: 3, price: 349.90, color: '#777a7e' },
  { id: 'anual', name: 'Plano Anual', months: 12, price: 1199.90, color: '#242426' }
];

const isoToday = () => new Date().toISOString().slice(0, 10);
const addMonths = (date, months) => {
  const value = new Date(`${date}T12:00:00`);
  const day = value.getDate();
  value.setDate(1);
  value.setMonth(value.getMonth() + months);
  value.setDate(Math.min(day, new Date(value.getFullYear(), value.getMonth() + 1, 0).getDate()));
  return value.toISOString().slice(0, 10);
};
const formatDate = (date) => date ? dateFmt.format(new Date(`${date}T00:00:00Z`)) : '—';
const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
function photoPickerMarkup(photo = '', prefix = 'profile') {
  return `<div class="photo-picker full" id="${prefix}-photo-picker"><div class="photo-preview" id="${prefix}-photo-preview">${photo ? `<img src="${escapeHtml(photo)}" alt="Foto selecionada">` : '<span>Sem foto</span>'}</div><div><strong>Foto do perfil</strong><small>A imagem será reduzida automaticamente para não pesar no sistema.</small><div class="photo-actions"><label class="photo-button">Enviar foto<input id="${prefix}-photo-upload" type="file" accept="image/*"></label><button class="photo-button" id="${prefix}-open-camera" type="button">Abrir webcam</button></div><div class="webcam-area" id="${prefix}-webcam-area" hidden><video id="${prefix}-webcam-video" autoplay playsinline muted></video><div class="photo-actions"><button class="photo-button capture-photo-button" id="${prefix}-capture-photo" type="button">Tirar foto</button><button class="photo-button" id="${prefix}-cancel-camera" type="button">Cancelar</button></div></div></div><input name="photo" id="${prefix}-photo-value" type="hidden" value="${escapeHtml(photo)}"></div>`;
}
function compressPhoto(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader(); reader.onerror = reject;
    reader.onload = () => { const image = new Image(); image.onerror = reject; image.onload = () => { const max = 600; const scale = Math.min(1, max / Math.max(image.width, image.height)); const canvas = document.createElement('canvas'); canvas.width = Math.round(image.width * scale); canvas.height = Math.round(image.height * scale); canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height); resolve(canvas.toDataURL('image/jpeg', .72)); }; image.src = reader.result; };
    reader.readAsDataURL(file);
  });
}
function bindPhotoPicker(prefix) {
  const setPhoto = async event => { const file = event.target.files[0]; if (!file) return; try { const photo = await compressPhoto(file); document.querySelector(`#${prefix}-photo-value`).value = photo; document.querySelector(`#${prefix}-photo-preview`).innerHTML = `<img src="${photo}" alt="Foto selecionada">`; showToast('Foto pronta para salvar.'); } catch { showToast('Não foi possível processar esta foto.'); } };
  document.querySelector(`#${prefix}-photo-upload`).addEventListener('change', setPhoto);
  let cameraStream = null;
  const stopCamera = () => { cameraStream?.getTracks().forEach(track => track.stop()); cameraStream = null; const area = document.querySelector(`#${prefix}-webcam-area`); if (area) area.hidden = true; };
  document.querySelector(`#${prefix}-open-camera`).addEventListener('click', async () => {
    if (!navigator.mediaDevices?.getUserMedia) return showToast('A webcam não está disponível neste navegador.');
    try { cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false }); const video = document.querySelector(`#${prefix}-webcam-video`); video.srcObject = cameraStream; document.querySelector(`#${prefix}-webcam-area`).hidden = false; showToast('Webcam liberada. Posicione-se e tire a foto.'); }
    catch { showToast('Permissão da webcam negada. Libere a câmera nas configurações do navegador.'); }
  });
  document.querySelector(`#${prefix}-capture-photo`).addEventListener('click', () => { const video = document.querySelector(`#${prefix}-webcam-video`); if (!video.videoWidth) return showToast('Aguarde a webcam carregar.'); const max = 600; const scale = Math.min(1, max / Math.max(video.videoWidth, video.videoHeight)); const canvas = document.createElement('canvas'); canvas.width = Math.round(video.videoWidth * scale); canvas.height = Math.round(video.videoHeight * scale); canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height); const photo = canvas.toDataURL('image/jpeg', .72); document.querySelector(`#${prefix}-photo-value`).value = photo; document.querySelector(`#${prefix}-photo-preview`).innerHTML = `<img src="${photo}" alt="Foto tirada pela webcam">`; stopCamera(); showToast('Foto tirada e pronta para salvar.'); });
  document.querySelector(`#${prefix}-cancel-camera`).addEventListener('click', stopCamera);
  systemModal.addEventListener('close', stopCamera, { once: true });
}

function seedData() {
  if (localStorage.getItem('rr-academia-data')) return JSON.parse(localStorage.getItem('rr-academia-data'));
  const today = isoToday();
  const sample = {
    students: [
      { id: crypto.randomUUID(), name: 'Mariana Costa', cpf: '123.456.789-10', email: 'mariana@email.com', phone: '(11) 99999-1201', birth: '1994-05-18', weight: '62', height: '1.67', plan: 'anual', payment: 'Cartão de crédito', start: today, end: addMonths(today, 12), active: true },
      { id: crypto.randomUUID(), name: 'Rafael Mendes', cpf: '234.567.890-21', email: 'rafael@email.com', phone: '(11) 98888-4502', birth: '1988-09-03', weight: '', height: '', plan: 'trimestral', payment: 'PIX', start: today, end: addMonths(today, 3), active: true },
      { id: crypto.randomUUID(), name: 'Carla Souza', cpf: '345.678.901-32', email: 'carla@email.com', phone: '(11) 97777-8303', birth: '1999-12-11', weight: '', height: '', plan: 'mensal', payment: 'Dinheiro', start: today, end: addMonths(today, 1), active: true }
    ],
    transactions: [],
    settings: { academy: 'Academia Shape Combat', document: '', phone: '', email: '', address: '', notifications: true }
  };
  sample.transactions = sample.students.map((student, index) => ({ id: crypto.randomUUID(), studentId: student.id, description: `Mensalidade • ${student.name}`, amount: plans.find(plan => plan.id === student.plan).price, date: new Date(Date.now() - index * 86400000 * 5).toISOString().slice(0, 10), method: student.payment, status: 'Recebido' }));
  localStorage.setItem('rr-academia-data', JSON.stringify(sample));
  return sample;
}

let data = seedData();
// Atualiza instalações que já tenham dados salvos no navegador.
if (data.settings?.academy === 'RR Academia') data.settings.academy = 'Academia Shape Combat';
if (!data.students.some(student => student.email === 'lucas.atrasado@exemplo.com')) {
  const start = isoToday();
  const overdueStudent = { id: crypto.randomUUID(), name: 'Lucas Oliveira', cpf: '456.789.012-43', email: 'lucas.atrasado@exemplo.com', phone: '(11) 98888-7766', birth: '1992-04-10', weight: '', height: '', plan: 'mensal', payment: 'PIX', start, end: addMonths(start, 1), active: true };
  data.students.push(overdueStudent);
  data.transactions.unshift({ id: crypto.randomUUID(), studentId: overdueStudent.id, description: `Mensalidade • ${overdueStudent.name}`, amount: plans.find(plan => plan.id === overdueStudent.plan).price, date: start, method: overdueStudent.payment, status: 'Pendente' });
  localStorage.setItem('rr-academia-data', JSON.stringify(data));
}
if (!data.employees) {
  data.employees = [];
  localStorage.setItem('rr-academia-data', JSON.stringify(data));
}
if (!data.employees.some(employee => employee.email === 'funcionario@rracademia.com')) {
  data.employees.push({
    id: crypto.randomUUID(),
    name: 'João Funcionário',
    cpf: '987.654.321-00',
    crea: '',
    role: 'Recepcionista',
    gender: 'Masculino',
    entryTime: '08:00',
    exitTime: '17:00',
    shirtSize: 'M',
    salary: 2200,
    phone: '(11) 99999-0000',
    address: 'Endereço a atualizar',
    hasChildren: false,
    childrenCount: 0,
    email: 'funcionario@rracademia.com',
    password: 'func123'
  });
  localStorage.setItem('rr-academia-data', JSON.stringify(data));
}
if (!data.timeRecords) data.timeRecords = [];
if (!data.expenses) data.expenses = [];
const defaultExpenseCategories = ['Maquinários', 'Energia elétrica', 'Aluguel da academia', 'Água', 'Itens extras'];
defaultExpenseCategories.forEach(category => {
  if (!data.expenses.some(expense => expense.category === category && expense.dueDate.slice(0, 7) === isoToday().slice(0, 7))) {
    const previous = data.expenses.filter(expense => expense.category === category).sort((a, b) => b.dueDate.localeCompare(a.dueDate))[0];
    data.expenses.push({ id: crypto.randomUUID(), category, description: previous?.description || category, amount: Number(previous?.amount || 0), dueDate: isoToday(), status: 'Pendente', monthly: true });
  }
});
data.employees.forEach(employee => { if (employee.active === undefined) employee.active = true; });
if (!data.payrollHistory) data.payrollHistory = {};
const payrollMonthKey = isoToday().slice(0, 7);
const savedPayrollMonth = data.payrollHistory[payrollMonthKey] || [];
data.payrollHistory[payrollMonthKey] = data.employees.filter(employee => employee.active !== false).map(employee => ({ id: `payroll-${employee.id}`, category: 'Funcionários', description: `Salário • ${employee.name}`, amount: Number(employee.salary || 0), dueDate: isoToday(), status: savedPayrollMonth.find(item => item.id === `payroll-${employee.id}`)?.status || 'Pendente', automatic: true }));
const demoEmployee = data.employees.find(employee => employee.email === 'funcionario@rracademia.com');
if (demoEmployee) { demoEmployee.entryTime = '06:00'; demoEmployee.exitTime = '16:00'; }
if (!data.settings.latitude) data.settings = { ...data.settings, latitude: '-23.550520', longitude: '-46.633308', allowedRadius: '200' };
localStorage.setItem('rr-academia-data', JSON.stringify(data));
if (!data.schedules) {
  data.schedules = [
    { id: crypto.randomUUID(), date: '2026-07-15', time: '08:00', period: 'Manhã', activity: 'Pilates', instructor: 'Prof. Ana' },
    { id: crypto.randomUUID(), date: '2026-07-15', time: '15:00', period: 'Tarde', activity: 'Jump', instructor: 'Prof. Bruno' },
    { id: crypto.randomUUID(), date: '2026-07-15', time: '19:30', period: 'Noite', activity: 'Dance', instructor: 'Prof. Camila' },
    { id: crypto.randomUUID(), date: '2026-07-17', time: '07:00', period: 'Manhã', activity: 'Funcional', instructor: 'Prof. Marcos' },
    { id: crypto.randomUUID(), date: '2026-07-20', time: '18:30', period: 'Noite', activity: 'Spinning', instructor: 'Prof. Luana' },
    { id: crypto.randomUUID(), date: '2026-07-22', time: '09:00', period: 'Manhã', activity: 'Yoga', instructor: 'Prof. Ana' }
  ];
  localStorage.setItem('rr-academia-data', JSON.stringify(data));
}
if (!data.notifications) {
  data.notifications = [{ id: crypto.randomUUID(), title: 'Feriado nesta sexta-feira', message: 'Atenção, alunos! Nesta sexta-feira a academia funcionará em horário especial, das 6h às 12h.', date: '2026-07-17', audience: 'Todos os alunos', priority: 'Importante', image: 'notification-holiday.png', createdAt: new Date().toISOString() }];
  localStorage.setItem('rr-academia-data', JSON.stringify(data));
}
let currentView = 'overview';
let loginType = 'admin';
let currentUser = { type: 'admin', name: 'Laleska', email: 'laleska' };
let agendaMonth = new Date(2026, 6, 1);
let selectedAgendaDate = '2026-07-15';
const save = () => {
  localStorage.setItem('rr-academia-data', JSON.stringify(data));
  fetch('/api/notifications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data.notifications || [])
  }).catch(() => showToast('Dados salvos. A sincronização com o app dos alunos ficará pendente.'));
  updateBadges();
};
const updateBadges = () => {
  const studentCount = document.querySelector('#student-count');
  if (studentCount) studentCount.textContent = data.students.filter(student => student.active).length;
  const pendingCount = document.querySelector('#pending-count');
  if (pendingCount) pendingCount.textContent = data.transactions.filter(item => item.status === 'Pendente').length;
  const notificationCount = document.querySelector('#notification-count');
  if (notificationCount) notificationCount.textContent = data.notifications.length;
  const employeeCount = document.querySelector('#employee-count');
  if (employeeCount) employeeCount.textContent = data.employees.length;
};
const showScreen = id => { screens.forEach(screen => screen.classList.toggle('active', screen.id === id)); window.scrollTo(0, 0); };
setTimeout(() => showScreen('login'), 1900);

document.querySelector('#login-form').addEventListener('submit', event => {
  event.preventDefault();
  const email = document.querySelector('#email').value.trim().toLowerCase();
  const password = document.querySelector('#password').value;
  const error = document.querySelector('#login-error');
  error.textContent = '';
  const employee = data.employees.find(item => item.email.toLowerCase() === email && item.password === password);
  const personalEmployee = data.employees.find(item => item.email === 'funcionario@rracademia.com') || data.employees[0];
  if (loginType === 'admin' && email === 'laleska' && password === '12345') {
    currentUser = { type: 'admin', name: 'Laleska', email };
    prepareUserAccess(); showScreen('welcome');
  } else if (loginType === 'employee' && email === 'personal' && password === '112233') {
    currentUser = { type: 'employee', name: 'Personal', email, id: personalEmployee?.id };
    prepareUserAccess(); showScreen('welcome');
  } else if (loginType === 'employee' && employee) {
    currentUser = { type: 'employee', name: employee.name, email: employee.email, id: employee.id };
    prepareUserAccess(); showScreen('welcome');
  } else error.textContent = 'E-mail ou senha incorretos para este tipo de acesso.';
});
document.querySelectorAll('[data-login-type]').forEach(button => button.addEventListener('click', () => {
  loginType = button.dataset.loginType;
  document.querySelectorAll('[data-login-type]').forEach(item => item.classList.toggle('active', item === button));
  document.querySelector('.form-wrap > .eyebrow').textContent = loginType === 'admin' ? 'ACESSO ADMINISTRATIVO' : 'ACESSO DO FUNCIONÁRIO';
  document.querySelector('#login-error').textContent = '';
}));

function prepareUserAccess() {
  const isAdmin = currentUser.type === 'admin';
  document.querySelectorAll('.admin-only').forEach(item => item.hidden = !isAdmin);
  document.querySelectorAll('.employee-only').forEach(item => item.hidden = isAdmin);
  document.querySelector('.sidebar-user strong').textContent = currentUser.name;
  document.querySelector('.sidebar-user span').textContent = currentUser.email;
  document.querySelector('.sidebar-user .avatar').textContent = currentUser.name.split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase();
  const employee = !isAdmin ? data.employees.find(item => item.id === currentUser.id) : null;
  document.querySelector('#profile-avatar').innerHTML = employee?.photo ? `<img src="${escapeHtml(employee.photo)}" alt="Foto de ${escapeHtml(employee.name)}">` : currentUser.name.split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase();
  document.querySelector('.welcome-card h2').innerHTML = `Bem-vindo, <em>${escapeHtml(currentUser.name)}!</em>`;
  document.querySelectorAll('.nav-item').forEach(item => item.classList.toggle('active', item.dataset.view === 'overview'));
}
document.querySelector('#toggle-password').addEventListener('click', event => {
  const input = document.querySelector('#password');
  input.type = input.type === 'text' ? 'password' : 'text';
  event.currentTarget.setAttribute('aria-label', input.type === 'text' ? 'Ocultar senha' : 'Mostrar senha');
});

const forgotModal = document.querySelector('#forgot-modal');
document.querySelector('#forgot-button').addEventListener('click', () => { document.querySelector('#forgot-step').hidden = false; document.querySelector('#sent-step').hidden = true; document.querySelector('#recovery-email').value = document.querySelector('#email').value; forgotModal.showModal(); });
document.querySelector('#modal-close').addEventListener('click', () => forgotModal.close());
document.querySelector('#forgot-form').addEventListener('submit', event => { event.preventDefault(); const email = document.querySelector('#recovery-email').value.trim(); if (!email) return; document.querySelector('#sent-email').textContent = email; document.querySelector('#forgot-step').hidden = true; document.querySelector('#sent-step').hidden = false; });
document.querySelector('#back-login').addEventListener('click', () => forgotModal.close());

document.querySelector('#continue-button').addEventListener('click', () => { showScreen('dashboard'); renderView('overview'); });
function openLogoutConfirmation() {
  systemModal.innerHTML = `<button class="modal-close" data-cancel-logout aria-label="Fechar">×</button><div class="logout-modal-content"><div class="logout-modal-icon">↪</div><span class="eyebrow dark">ENCERRAR SESSÃO</span><h2>Deseja mesmo sair?</h2><p>Você precisará informar seu e-mail e senha novamente para acessar o sistema.</p><div class="logout-modal-actions"><button class="logout-cancel-button" type="button" data-cancel-logout>Cancelar</button><button class="logout-confirm-button" type="button" id="confirm-logout">Sim, sair</button></div></div>`;
  systemModal.showModal();
  systemModal.querySelectorAll('[data-cancel-logout]').forEach(button => button.addEventListener('click', () => systemModal.close()));
  systemModal.querySelector('#confirm-logout').addEventListener('click', () => {
    document.querySelector('#password').value = '';
    document.querySelector('#login-error').textContent = '';
    document.querySelector('.sidebar').classList.remove('open');
    systemModal.close();
    showScreen('login');
  });
}
document.querySelector('#logout-button').addEventListener('click', openLogoutConfirmation);
document.querySelector('#employee-profile-button').addEventListener('click', openEmployeeProfile);
document.querySelector('#menu-button').addEventListener('click', () => document.querySelector('.sidebar').classList.toggle('open'));
const globalSearchInput = document.querySelector('#global-search-input');
function runGlobalSearch() {
  const query = globalSearchInput.value.trim();
  document.querySelectorAll('.nav-item').forEach(button => button.classList.toggle('active', button.dataset.view === 'students'));
  renderStudents(query);
  if (!query) document.querySelector('#student-search')?.focus();
}
document.querySelector('#global-search-button').addEventListener('click', runGlobalSearch);
document.querySelector('#top-notifications').addEventListener('click', () => {
  document.querySelectorAll('.nav-item').forEach(button => button.classList.toggle('active', button.dataset.view === 'notifications'));
  renderView('notifications');
});
globalSearchInput.addEventListener('keydown', event => {
  if (event.key === 'Enter') runGlobalSearch();
});
document.querySelectorAll('.nav-item').forEach(item => item.addEventListener('click', () => {
  if (item.dataset.view === 'logout') { document.querySelector('.sidebar').classList.remove('open'); openLogoutConfirmation(); return; }
  document.querySelectorAll('.nav-item').forEach(button => button.classList.remove('active'));
  item.classList.add('active');
  document.querySelector('.sidebar').classList.remove('open');
  renderView(item.dataset.view);
}));

function renderView(view) {
  if (currentUser.type !== 'admin' && ['finance', 'payments', 'employees', 'settings'].includes(view)) view = 'overview';
  currentView = view;
  const renderers = { overview: renderOverview, students: renderStudents, plans: renderPlans, employees: renderEmployees, timeclock: renderTimeClock, finance: renderFinance, payments: renderPayments, settings: renderSettings, agenda: renderAgenda, notifications: renderNotifications };
  (renderers[view] || renderOverview)();
  window.scrollTo(0, 0);
  updateBadges();
}

function heading(label, title, subtitle, action = '') {
  return `<div class="page-heading"><div><span class="eyebrow dark">${label}</span><h1>${title}</h1><p>${subtitle}</p></div>${action}</div>`;
}

function renderOverview() {
  const active = data.students.filter(student => student.active);
  const revenue = data.transactions.filter(item => item.status === 'Recebido').reduce((sum, item) => sum + Number(item.amount), 0);
  const pending = data.transactions.filter(item => item.status === 'Pendente').length;
  const planTotals = plans.map(plan => ({ ...plan, count: active.filter(student => student.plan === plan.id).length }));
  const maxPlan = Math.max(...planTotals.map(plan => plan.count), 1);
  const financialCards = currentUser.type === 'admin' ? `<article class="stat-card"><div class="stat-icon blue">$</div><span>RECEITA TOTAL</span><strong>${money.format(revenue)}</strong><p class="up">● Valores recebidos</p></article><article class="stat-card"><div class="stat-icon orange">!</div><span>PAGAMENTOS PENDENTES</span><strong>${pending}</strong><p class="down">Acompanhe no financeiro</p></article>` : `<article class="stat-card"><div class="stat-icon blue">▦</div><span>AGENDA</span><strong>${data.schedules.length}</strong><p class="up">Atividades programadas</p></article><article class="stat-card"><div class="stat-icon orange">●</div><span>NOTIFICAÇÕES</span><strong>${data.notifications.length}</strong><p class="up">Comunicados ativos</p></article>`;
  dashboardContent.innerHTML = `${heading('VISÃO GERAL', `Bom dia, ${escapeHtml(currentUser.name)}! 👋`, 'Acompanhe os números reais da sua academia.', '<button class="primary-action" id="quick-student">＋ Cadastrar aluno</button>')}
    <div class="stats-grid"><article class="stat-card"><div class="stat-icon mint">♙</div><span>ALUNOS ATIVOS</span><strong>${active.length}</strong><p class="up">● Base atualizada</p></article>${financialCards}<article class="stat-card"><div class="stat-icon purple">▣</div><span>PLANOS DISPONÍVEIS</span><strong>${plans.length}</strong><p class="up">Mensal, trimestral e anual</p></article></div>
    <div class="dashboard-grid"><article class="panel chart-panel"><div class="panel-header"><div><h3>Alunos por plano</h3><p>Distribuição atual dos alunos ativos</p></div></div><div class="live-chart">${planTotals.map(plan => `<div class="chart-column"><span>${plan.count}</span><b style="height:${20 + (plan.count / maxPlan) * 130}px;background:${plan.color}"></b><small>${plan.name.replace('Plano ', '')}</small></div>`).join('')}</div></article>
    <article class="panel plans-panel"><div class="panel-header"><div><h3>Resumo de planos</h3><p>Participação na base ativa</p></div></div><ul class="plan-summary">${planTotals.map(plan => `<li><i style="background:${plan.color}"></i><span>${plan.name}</span><strong>${active.length ? Math.round(plan.count / active.length * 100) : 0}%</strong></li>`).join('')}</ul></article></div>
    ${currentUser.type === 'admin' ? recentTransactions() : ''}`;
  document.querySelector('#quick-student').addEventListener('click', () => openStudentModal());
}

function recentTransactions() {
  const rows = data.transactions.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  return `<article class="panel activity-panel"><div class="panel-header"><div><h3>Movimentações recentes</h3><p>Últimos lançamentos financeiros</p></div></div><div class="activity-list">${rows.length ? rows.map(item => `<div><span class="activity-icon mint">$</span><p><strong>${escapeHtml(item.description)}</strong><small>${money.format(item.amount)} • ${escapeHtml(item.method)}</small></p><time>${formatDate(item.date)}</time></div>`).join('') : '<p class="empty">Nenhuma movimentação.</p>'}</div></article>`;
}

function renderStudents(query = '') {
  const filtered = data.students.filter(student => [student.name, student.cpf, student.email, student.phone].some(value => value.toLowerCase().includes(query.toLowerCase())));
  dashboardContent.innerHTML = `${heading('ALUNOS', 'Alunos cadastrados', `${data.students.filter(student => student.active).length} alunos ativos`, '<button class="primary-action" id="new-student">＋ Cadastrar aluno</button>')}
    <div class="toolbar"><div class="table-search">⌕ <input id="student-search" value="${escapeHtml(query)}" placeholder="Buscar por nome, CPF, e-mail ou telefone"></div><button class="filter-button active-filter" data-filter="all">Todos</button><button class="filter-button" data-filter="active">Ativos</button></div>
    <article class="panel table-panel"><div class="responsive-table"><table><thead><tr><th>ALUNO</th><th>CONTATO</th><th>PLANO</th><th>VIGÊNCIA</th><th>STATUS</th><th></th></tr></thead><tbody>${filtered.length ? filtered.map(studentRow).join('') : '<tr><td colspan="6" class="empty">Nenhum aluno encontrado.</td></tr>'}</tbody></table></div></article>`;
  document.querySelector('#new-student').addEventListener('click', () => openStudentModal());
  document.querySelector('#student-search').addEventListener('input', event => {
    const term = event.target.value.toLowerCase();
    const matches = data.students.filter(student => [student.name, student.cpf, student.email, student.phone].some(value => value.toLowerCase().includes(term)));
    document.querySelector('tbody').innerHTML = matches.length ? matches.map(studentRow).join('') : '<tr><td colspan="6" class="empty">Nenhum aluno encontrado.</td></tr>';
    bindStudentEdits();
  });
  document.querySelector('[data-filter="active"]').addEventListener('click', () => renderStudentFilter(true));
  bindStudentEdits();
}

function bindStudentEdits() {
  document.querySelectorAll('[data-edit-student]').forEach(button => button.addEventListener('click', () => openStudentModal(button.dataset.editStudent)));
}

function renderStudentFilter(activeOnly) {
  renderStudents('');
  if (!activeOnly) return;
  document.querySelector('tbody').innerHTML = data.students.filter(student => student.active).map(studentRow).join('') || '<tr><td colspan="6" class="empty">Nenhum aluno ativo.</td></tr>';
  document.querySelectorAll('.filter-button').forEach(button => button.classList.toggle('active-filter', button.dataset.filter === 'active'));
  bindStudentEdits();
}

function studentRow(student) {
  const plan = plans.find(item => item.id === student.plan);
  const avatar = student.photo ? `<img src="${escapeHtml(student.photo)}" alt="Foto de ${escapeHtml(student.name)}">` : student.name.split(' ').map(part => part[0]).slice(0, 2).join('');
  return `<tr><td><div class="student-cell"><span>${avatar}</span><div><strong>${escapeHtml(student.name)}</strong><small>${escapeHtml(student.cpf)}</small></div></div></td><td><strong>${escapeHtml(student.email)}</strong><small>${escapeHtml(student.phone)}</small></td><td>${plan?.name || '—'}<small>${escapeHtml(student.payment)}</small></td><td>${formatDate(student.start)}<small>até ${formatDate(student.end)}</small></td><td><span class="status ${student.active ? 'status-active' : 'status-inactive'}">${student.active ? 'Ativo' : 'Inativo'}</span></td><td><button class="row-action" data-edit-student="${student.id}">Editar</button></td></tr>`;
}

function openStudentModal(id = null) {
  const student = id ? data.students.find(item => item.id === id) : null;
  const start = student?.start || isoToday();
  systemModal.innerHTML = `<button class="modal-close" data-close-modal aria-label="Fechar">×</button><span class="eyebrow dark">${student ? 'EDITAR ALUNO' : 'NOVO CADASTRO'}</span><h2>${student ? 'Dados do aluno' : 'Cadastrar aluno'}</h2><p>Preencha os dados pessoais, o plano e a forma de pagamento.</p><form id="student-form" class="system-form">${photoPickerMarkup(student?.photo, 'student')}
    <div class="form-grid"><label class="full">Nome completo<input name="name" required value="${escapeHtml(student?.name)}"></label><label>CPF<input name="cpf" required maxlength="14" value="${escapeHtml(student?.cpf)}"></label><label>Data de nascimento<input name="birth" type="date" required value="${student?.birth || ''}"></label><label>E-mail<input name="email" type="email" required value="${escapeHtml(student?.email)}"></label><label>Telefone<input name="phone" required value="${escapeHtml(student?.phone)}"></label>
    <label>Plano<select name="plan" id="student-plan">${plans.map(plan => `<option value="${plan.id}" ${student?.plan === plan.id ? 'selected' : ''}>${plan.name} — ${money.format(plan.price)}</option>`).join('')}</select></label><label>Forma de pagamento<select name="payment">${['PIX', 'Cartão de crédito', 'Cartão de débito', 'Dinheiro', 'Boleto'].map(method => `<option ${student?.payment === method ? 'selected' : ''}>${method}</option>`).join('')}</select></label>
    <label>Início do plano<input name="start" id="plan-start" type="date" required value="${start}"></label><label>Fim do plano<input name="end" id="plan-end" type="date" readonly value="${student?.end || addMonths(start, 1)}"></label>
    <div class="personal-fields full"><div><strong>Avaliação física</strong><small>Peso e altura devem ser preenchidos posteriormente pelo personal.</small></div><label>Peso (kg)<input name="weight" type="number" step="0.1" ${student ? '' : 'disabled'} value="${student?.weight || ''}"></label><label>Altura (m)<input name="height" type="number" step="0.01" ${student ? '' : 'disabled'} value="${student?.height || ''}"></label></div>
    ${student ? `<label class="switch-field full"><input name="active" type="checkbox" ${student.active ? 'checked' : ''}> Aluno ativo</label>` : ''}</div><button class="primary-button" type="submit">${student ? 'Salvar alterações' : 'Concluir cadastro'}</button></form>`;
  systemModal.showModal();
  bindPhotoPicker('student');
  const updateEnd = () => { const plan = plans.find(item => item.id === document.querySelector('#student-plan').value); const date = document.querySelector('#plan-start').value; document.querySelector('#plan-end').value = date ? addMonths(date, plan.months) : ''; };
  document.querySelector('#student-plan').addEventListener('change', updateEnd);
  document.querySelector('#plan-start').addEventListener('change', updateEnd);
  if (!student) updateEnd();
  systemModal.querySelector('[data-close-modal]').addEventListener('click', () => systemModal.close());
  document.querySelector('#student-form').addEventListener('submit', event => saveStudent(event, student));
}

function saveStudent(event, existing) {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(event.currentTarget));
  if (data.students.some(student => student.cpf === values.cpf && student.id !== existing?.id)) { showToast('Já existe um aluno cadastrado com este CPF.'); return; }
  const record = { id: existing?.id || crypto.randomUUID(), name: values.name.trim(), cpf: values.cpf.trim(), email: values.email.trim(), phone: values.phone.trim(), photo: values.photo || existing?.photo || '', birth: values.birth, weight: values.weight || existing?.weight || '', height: values.height || existing?.height || '', plan: values.plan, payment: values.payment, start: values.start, end: values.end, active: existing ? values.active === 'on' : true };
  if (existing) Object.assign(existing, record);
  else {
    data.students.unshift(record);
    const plan = plans.find(item => item.id === record.plan);
    data.transactions.unshift({ id: crypto.randomUUID(), studentId: record.id, description: `Mensalidade • ${record.name}`, amount: plan.price, date: record.start, method: record.payment, status: 'Recebido' });
  }
  save(); systemModal.close(); renderStudents(); showToast(existing ? 'Dados atualizados com sucesso.' : 'Aluno cadastrado com sucesso.');
}

function renderPlans() {
  dashboardContent.innerHTML = `${heading('PLANOS', 'Nossos planos', 'Opções disponíveis para novos alunos.')}
    <div class="plans-grid">${plans.map(plan => `<article class="plan-card ${plan.id === 'anual' ? 'featured' : ''}">${plan.id === 'anual' ? '<span class="recommended">MAIS VANTAJOSO</span>' : ''}<span class="plan-period">${plan.months} ${plan.months === 1 ? 'MÊS' : 'MESES'}</span><h2>${plan.name}</h2><strong>${money.format(plan.price)}</strong><small>por período</small><ul><li>✓ Acesso completo à academia</li><li>✓ Avaliação física</li><li>✓ Acompanhamento de evolução</li><li>✓ Vigência automática no cadastro</li></ul><button class="primary-action choose-plan" data-plan="${plan.id}">Cadastrar com este plano</button></article>`).join('')}</div>`;
  document.querySelectorAll('.choose-plan').forEach(button => button.addEventListener('click', () => { openStudentModal(); setTimeout(() => { document.querySelector('#student-plan').value = button.dataset.plan; document.querySelector('#student-plan').dispatchEvent(new Event('change')); }, 0); }));
}

function renderEmployees(query = '') {
  const term = query.toLowerCase();
  const employees = data.employees.filter(employee => [employee.name, employee.cpf, employee.role, employee.email, employee.phone].some(value => String(value || '').toLowerCase().includes(term)));
  dashboardContent.innerHTML = `${heading('EQUIPE', 'Funcionários', `${data.employees.length} funcionários cadastrados`, '<button class="primary-action" id="new-employee">＋ Cadastrar funcionário</button>')}
    <div class="toolbar"><div class="table-search">⌕ <input id="employee-search" value="${escapeHtml(query)}" placeholder="Buscar por nome, CPF, função, e-mail ou telefone"></div></div>
    <article class="panel table-panel"><div class="responsive-table"><table><thead><tr><th>FUNCIONÁRIO</th><th>FUNÇÃO</th><th>CONTATO</th><th>HORÁRIO</th><th>SALÁRIO</th><th></th></tr></thead><tbody>${employees.length ? employees.map(employeeRow).join('') : '<tr><td colspan="6" class="empty">Nenhum funcionário encontrado.</td></tr>'}</tbody></table></div></article>`;
  document.querySelector('#new-employee').addEventListener('click', () => openEmployeeModal());
  const bindEmployeeEdits = () => {
    document.querySelectorAll('[data-edit-employee]').forEach(button => button.addEventListener('click', () => openEmployeeModal(button.dataset.editEmployee)));
    document.querySelectorAll('[data-time-history]').forEach(button => button.addEventListener('click', () => openTimeHistory(button.dataset.timeHistory)));
  };
  document.querySelector('#employee-search').addEventListener('input', event => {
    const search = event.target.value.toLowerCase();
    const matches = data.employees.filter(employee => [employee.name, employee.cpf, employee.role, employee.email, employee.phone].some(value => String(value || '').toLowerCase().includes(search)));
    document.querySelector('tbody').innerHTML = matches.length ? matches.map(employeeRow).join('') : '<tr><td colspan="6" class="empty">Nenhum funcionário encontrado.</td></tr>';
    bindEmployeeEdits();
  });
  bindEmployeeEdits();
}

function employeeRow(employee) {
  const initials = employee.photo ? `<img src="${escapeHtml(employee.photo)}" alt="Foto de ${escapeHtml(employee.name)}">` : employee.name.split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase();
  return `<tr><td><div class="student-cell"><span>${initials}</span><div><strong>${escapeHtml(employee.name)}</strong><small>${escapeHtml(employee.cpf)}${employee.crea ? ` • CREA ${escapeHtml(employee.crea)}` : ''}</small></div></div></td><td><strong>${escapeHtml(employee.role)}</strong><small>${escapeHtml(employee.gender)} • Blusa ${escapeHtml(employee.shirtSize)}</small></td><td><strong>${escapeHtml(employee.phone)}</strong><small>${escapeHtml(employee.email)}</small></td><td>${escapeHtml(employee.entryTime)} às ${escapeHtml(employee.exitTime)}</td><td><strong>${money.format(employee.salary || 0)}</strong></td><td><div class="row-actions"><button class="row-action" data-time-history="${employee.id}">Folha de ponto</button><button class="row-action" data-edit-employee="${employee.id}">Editar</button></div></td></tr>`;
}

function openEmployeeModal(id = null) {
  const employee = id ? data.employees.find(item => item.id === id) : null;
  systemModal.innerHTML = `<button class="modal-close" data-close-modal aria-label="Fechar">×</button><span class="eyebrow dark">${employee ? 'EDITAR FUNCIONÁRIO' : 'NOVO FUNCIONÁRIO'}</span><h2>${employee ? 'Dados do funcionário' : 'Cadastrar funcionário'}</h2><p>Os dados de acesso permitem que o funcionário entre no sistema com permissões restritas.</p><form id="employee-form" class="system-form">${photoPickerMarkup(employee?.photo, 'employee')}<div class="form-grid">
    <label class="full">Nome completo<input name="name" required value="${escapeHtml(employee?.name)}"></label><label>CPF<input name="cpf" required value="${escapeHtml(employee?.cpf)}"></label><label>CREA (se tiver)<input name="crea" value="${escapeHtml(employee?.crea)}"></label>
    <label>Função<input name="role" required value="${escapeHtml(employee?.role)}" placeholder="Ex.: Personal trainer"></label><label>Sexo<select name="gender">${['Feminino', 'Masculino', 'Outro', 'Prefiro não informar'].map(value => `<option ${employee?.gender === value ? 'selected' : ''}>${value}</option>`).join('')}</select></label>
    <label>Turno<select name="shift" id="employee-shift"><option value="morning" ${employee?.entryTime !== '16:00' ? 'selected' : ''}>06:00 às 16:00</option><option value="evening" ${employee?.entryTime === '16:00' ? 'selected' : ''}>16:00 às 23:00</option></select></label><input name="entryTime" id="employee-entry-time" type="hidden" value="${employee?.entryTime || '06:00'}"><input name="exitTime" id="employee-exit-time" type="hidden" value="${employee?.exitTime || '16:00'}"><label>Tamanho da blusa<select name="shirtSize">${['PP', 'P', 'M', 'G', 'GG', 'XGG'].map(value => `<option ${employee?.shirtSize === value ? 'selected' : ''}>${value}</option>`).join('')}</select></label><label>Salário<input name="salary" type="number" min="0" step="0.01" required value="${employee?.salary || ''}"></label>
    <label>Telefone<input name="phone" required value="${escapeHtml(employee?.phone)}"></label><label>URL da foto<input name="photo" type="url" value="${escapeHtml(employee?.photo)}" placeholder="https://..."></label><label class="full">Endereço<input name="address" required value="${escapeHtml(employee?.address)}"></label>
    <label>Possui filhos?<select name="hasChildren" id="employee-has-children"><option value="no" ${!employee?.hasChildren ? 'selected' : ''}>Não</option><option value="yes" ${employee?.hasChildren ? 'selected' : ''}>Sim</option></select></label><label>Quantidade de filhos<input name="childrenCount" id="employee-children-count" type="number" min="0" value="${employee?.childrenCount || 0}" ${employee?.hasChildren ? '' : 'disabled'}></label>
    <div class="form-subtitle full"><strong>Dados de acesso</strong><small>Use este e-mail e senha na opção “Funcionário” da tela de login.</small></div><label>E-mail de acesso<input name="email" type="email" required value="${escapeHtml(employee?.email)}"></label><label>Senha<input name="password" type="text" minlength="4" required value="${escapeHtml(employee?.password)}"></label>
    ${employee ? `<label class="switch-field full"><input name="active" type="checkbox" ${employee.active !== false ? 'checked' : ''}> Funcionário ativo</label>` : ''}</div><button class="primary-button" type="submit">${employee ? 'Salvar alterações' : 'Cadastrar funcionário'}</button></form>`;
  systemModal.showModal();
  bindPhotoPicker('employee');
  document.querySelector('input[name="photo"][type="url"]')?.closest('label').remove();
  systemModal.querySelector('[data-close-modal]').addEventListener('click', () => systemModal.close());
  document.querySelector('#employee-has-children').addEventListener('change', event => { const input = document.querySelector('#employee-children-count'); input.disabled = event.target.value !== 'yes'; if (input.disabled) input.value = 0; });
  document.querySelector('#employee-shift').addEventListener('change', event => { const morning = event.target.value === 'morning'; document.querySelector('#employee-entry-time').value = morning ? '06:00' : '16:00'; document.querySelector('#employee-exit-time').value = morning ? '16:00' : '23:00'; });
  document.querySelector('#employee-form').addEventListener('submit', event => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    values.photo = document.querySelector('#employee-photo-value').value;
    const duplicate = data.employees.find(item => item.email.toLowerCase() === values.email.trim().toLowerCase() && item.id !== employee?.id);
    if (duplicate) { showToast('Já existe um funcionário com este e-mail.'); return; }
    const record = { id: employee?.id || crypto.randomUUID(), ...values, name: values.name.trim(), email: values.email.trim().toLowerCase(), salary: Number(values.salary), active: employee ? values.active === 'on' : true, hasChildren: values.hasChildren === 'yes', childrenCount: values.hasChildren === 'yes' ? Number(values.childrenCount || 0) : 0 };
    if (employee) Object.assign(employee, record); else data.employees.unshift(record);
    save(); systemModal.close(); renderEmployees(); showToast(employee ? 'Funcionário atualizado.' : 'Funcionário cadastrado.');
  });
}

const currentTime = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false });
const minutesFromTime = value => { const [hours, minutes] = value.split(':').map(Number); return hours * 60 + minutes; };
function distanceInMeters(lat1, lon1, lat2, lon2) {
  const rad = value => value * Math.PI / 180;
  const a = Math.sin(rad(lat2 - lat1) / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lon2 - lon1) / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function renderTimeClock() {
  const employee = data.employees.find(item => item.id === currentUser.id);
  if (!employee) return renderView('overview');
  const today = isoToday();
  const record = data.timeRecords.find(item => item.employeeId === employee.id && item.date === today);
  dashboardContent.innerHTML = `${heading('PONTO', 'Meu ponto', `Turno combinado: ${employee.entryTime} às ${employee.exitTime}`)}
    <article class="panel timeclock-panel"><div class="timeclock-now"><span>HORÁRIO ATUAL</span><strong id="live-clock">${currentTime()}</strong><small>${formatDate(today)}</small></div><div class="timeline">
      ${timeStep('Entrada', record?.entry, 'Localização obrigatória')}${timeStep('Início do almoço', record?.lunchStart, 'Intervalo de 1 hora')}${timeStep('Fim do almoço', record?.lunchEnd, 'Após uma hora')}${timeStep('Saída', record?.exit, `Até ${employee.exitTime} + 30 min`)}</div>
      <div class="clock-actions">${!record?.entry ? '<button class="primary-action" id="clock-entry">Registrar entrada</button>' : !record.lunchStart ? '<button class="primary-action" id="clock-lunch-start">Iniciar almoço</button>' : !record.lunchEnd ? '<button class="primary-action" id="clock-lunch-end">Finalizar almoço</button>' : !record.exit ? '<button class="primary-action" id="clock-exit">Registrar saída</button>' : '<span class="status status-active">Jornada finalizada</span>'}</div><p class="location-note">⌖ A entrada só será registrada após permitir a localização e confirmar que você está dentro do raio configurado da academia.</p></article>`;
  const addTime = (field) => { let item = data.timeRecords.find(entry => entry.employeeId === employee.id && entry.date === today); if (!item) { item = { id: crypto.randomUUID(), employeeId: employee.id, date: today }; data.timeRecords.unshift(item); } item[field] = currentTime(); save(); renderTimeClock(); };
  document.querySelector('#clock-entry')?.addEventListener('click', () => registerEntryWithLocation(employee, addTime));
  document.querySelector('#clock-lunch-start')?.addEventListener('click', () => addTime('lunchStart'));
  document.querySelector('#clock-lunch-end')?.addEventListener('click', () => {
    const elapsed = minutesFromTime(currentTime()) - minutesFromTime(record.lunchStart);
    if (elapsed < 60) return showToast(`O almoço deve ter 1 hora. Faltam ${60 - elapsed} minutos.`);
    addTime('lunchEnd');
  });
  document.querySelector('#clock-exit')?.addEventListener('click', () => {
    if (minutesFromTime(currentTime()) > minutesFromTime(employee.exitTime) + 30) return showToast('Saída fora do limite de 30 minutos. Solicite uma justificativa ao administrador.');
    addTime('exit');
  });
}

function timeStep(label, value, description) { return `<div class="time-step ${value ? 'done' : ''}"><i>${value ? '✓' : '○'}</i><div><strong>${label}</strong><small>${description}</small></div><b>${value || '—'}</b></div>`; }
function registerEntryWithLocation(employee, done) {
  if (!navigator.geolocation) return showToast('A localização não está disponível neste dispositivo.');
  showToast('Permita o acesso à localização para registrar a entrada.');
  navigator.geolocation.getCurrentPosition(position => {
    const distance = distanceInMeters(position.coords.latitude, position.coords.longitude, Number(data.settings.latitude), Number(data.settings.longitude));
    if (distance > Number(data.settings.allowedRadius || 200)) return showToast(`Você está a ${Math.round(distance)} m da academia. Entrada não registrada.`);
    let item = data.timeRecords.find(entry => entry.employeeId === employee.id && entry.date === isoToday());
    if (!item) { item = { id: crypto.randomUUID(), employeeId: employee.id, date: isoToday() }; data.timeRecords.unshift(item); }
    item.location = { latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy };
    save(); done('entry');
  }, () => showToast('Não foi possível obter a localização. Verifique a permissão do navegador.'), { enableHighAccuracy: true, timeout: 12000 });
}

function openTimeHistory(employeeId) {
  const employee = data.employees.find(item => item.id === employeeId);
  const records = data.timeRecords.filter(item => item.employeeId === employeeId).sort((a, b) => b.date.localeCompare(a.date));
  systemModal.innerHTML = `<button class="modal-close" data-close-modal aria-label="Fechar">×</button><span class="eyebrow dark">FOLHA DE PONTO</span><h2>${escapeHtml(employee.name)}</h2><p>Turno: ${employee.entryTime} às ${employee.exitTime}. Justificativas são exclusivas do administrador.</p><div class="time-history">${records.length ? records.map(record => `<article><div><strong>${formatDate(record.date)}</strong><small>Entrada ${record.entry || '—'} • Almoço ${record.lunchStart || '—'}–${record.lunchEnd || '—'} • Saída ${record.exit || '—'}</small>${record.justification ? `<p><b>Justificativa:</b> ${escapeHtml(record.justification)}</p>` : ''}</div><button class="row-action" data-justify-record="${record.id}">Justificar</button></article>`).join('') : '<p class="empty">Nenhum ponto registrado.</p>'}</div>`;
  systemModal.showModal();
  systemModal.querySelector('[data-close-modal]').addEventListener('click', () => systemModal.close());
  systemModal.querySelectorAll('[data-justify-record]').forEach(button => button.addEventListener('click', () => openJustification(button.dataset.justifyRecord, employeeId)));
}

function openJustification(recordId, employeeId) {
  const record = data.timeRecords.find(item => item.id === recordId);
  systemModal.innerHTML = `<button class="modal-close" data-close-modal aria-label="Fechar">×</button><span class="eyebrow dark">JUSTIFICAR OCORRÊNCIA</span><h2>${formatDate(record.date)}</h2><form id="justification-form" class="system-form"><label>Justificativa<textarea name="justification" rows="5" required>${escapeHtml(record.justification || '')}</textarea></label><button class="primary-button" type="submit">Salvar justificativa</button></form>`;
  systemModal.querySelector('[data-close-modal]').addEventListener('click', () => systemModal.close());
  document.querySelector('#justification-form').addEventListener('submit', event => { event.preventDefault(); record.justification = new FormData(event.currentTarget).get('justification').trim(); save(); openTimeHistory(employeeId); showToast('Justificativa salva.'); });
}

function openEmployeeProfile() {
  const employee = data.employees.find(item => item.id === currentUser.id);
  if (!employee) return;
  const photo = employee.photo || '';
  systemModal.innerHTML = `<button class="modal-close" data-close-modal aria-label="Fechar">×</button><div class="profile-header">${photo ? `<img src="${escapeHtml(photo)}" alt="Foto de ${escapeHtml(employee.name)}">` : `<span>${employee.name.split(' ').map(part => part[0]).slice(0, 2).join('')}</span>`}<div><span class="eyebrow dark">MEU PERFIL</span><h2>${escapeHtml(employee.name)}</h2><p>${escapeHtml(employee.role)} • ${employee.entryTime} às ${employee.exitTime}</p></div></div><form id="profile-form" class="system-form"><div class="form-grid"><label>CPF<input disabled value="${escapeHtml(employee.cpf)}"></label><label>Função<input disabled value="${escapeHtml(employee.role)}"></label><label>Telefone<input name="phone" required value="${escapeHtml(employee.phone)}"></label><label>E-mail<input name="email" type="email" required value="${escapeHtml(employee.email)}"></label><label class="full">Endereço<input name="address" required value="${escapeHtml(employee.address)}"></label></div><button class="primary-button" type="submit">Salvar e atualizar</button></form>`;
  systemModal.showModal();
  systemModal.querySelector('[data-close-modal]').addEventListener('click', () => systemModal.close());
  document.querySelector('#profile-form').addEventListener('submit', event => {
    event.preventDefault(); const values = new FormData(event.currentTarget);
    employee.phone = values.get('phone').trim(); employee.email = values.get('email').trim().toLowerCase(); employee.address = values.get('address').trim(); currentUser.email = employee.email; save(); prepareUserAccess(); systemModal.close(); showToast('Perfil salvo e atualizado.');
  });
}

function renderFinance(period = 'month', method = 'all', planFilter = 'all') {
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentMonthLabel = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const closingDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toLocaleDateString('pt-BR');
  const filtered = data.transactions.filter(item => {
    const date = new Date(`${item.date}T12:00:00`);
    const inPeriod = period === 'day' ? item.date === isoToday() : period === 'year' ? date.getFullYear() === now.getFullYear() : date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    const student = data.students.find(entry => entry.id === item.studentId);
    const methodMatch = method === 'all' || item.method === method;
    const planMatch = planFilter === 'all' || student?.plan === planFilter;
    return inPeriod && methodMatch && planMatch;
  });
  const received = filtered.filter(item => item.status === 'Recebido').reduce((sum, item) => sum + Number(item.amount), 0);
  const pending = filtered.filter(item => item.status === 'Pendente').reduce((sum, item) => sum + Number(item.amount), 0);
  const total = received + pending;
  const percentage = total ? Math.round(received / total * 100) : 0;
  const payrollExpenses = data.employees.filter(employee => employee.active !== false).map(employee => { const saved = data.payrollHistory[currentMonthKey]?.find(item => item.id === `payroll-${employee.id}`); return { id: `payroll-${employee.id}`, category: 'Funcionários', description: `Salário • ${employee.name}`, amount: Number(employee.salary || 0), dueDate: isoToday(), status: saved?.status || 'Pendente', automatic: true }; });
  const currentManualExpenses = data.expenses.filter(item => item.dueDate.slice(0, 7) === currentMonthKey);
  const periodExpenses = [...payrollExpenses, ...currentManualExpenses];
  const paidExpenses = periodExpenses.filter(item => item.status === 'Pago').reduce((sum, item) => sum + Number(item.amount), 0);
  const pendingExpenses = periodExpenses.filter(item => item.status === 'Pendente').reduce((sum, item) => sum + Number(item.amount), 0);
  const enrolledRevenue = data.students.filter(student => student.start?.slice(0, 7) === currentMonthKey).reduce((sum, student) => sum + Number(plans.find(plan => plan.id === student.plan)?.price || 0), 0);
  const monthlyProfit = enrolledRevenue - paidExpenses - pendingExpenses;
  const daysUntilClosing = Math.ceil((new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59) - now) / 86400000);
  const canPayPayroll = daysUntilClosing <= 3;
  const expenseCategories = ['Funcionários', 'Maquinários', 'Energia elétrica', 'Aluguel da academia', 'Água', 'Itens extras'];
  dashboardContent.innerHTML = `${heading('FINANCEIRO', 'Controle de despesas', 'Acompanhe os custos mensais da academia.')}
    <div class="finance-section-heading expense-month-heading"><div><span class="eyebrow dark">CUSTOS MENSAIS</span><h2>Despesas da academia — ${currentMonthLabel}</h2><p>Fechamento em ${closingDate}. Salários dos funcionários ativos são incluídos automaticamente.</p></div><div class="expense-heading-actions"><div><strong>${money.format(paidExpenses + pendingExpenses)}</strong><small>Total do mês</small></div><button class="primary-action" id="new-expense">＋ Adicionar custo</button><button class="outline-button" id="import-expenses">↥ Importar despesas</button><input id="expense-file" type="file" accept=".csv,.json,text/csv,application/json" hidden></div></div>
    <div class="expense-category-grid">${expenseCategories.map(category => { const items = periodExpenses.filter(item => item.category === category); const value = items.reduce((sum, item) => sum + Number(item.amount), 0); return `<article><span>${expenseCategoryIcon(category)}</span><div><strong>${category}</strong><small>${items.length} ${items.length === 1 ? 'lançamento' : 'lançamentos'}</small></div><b>${money.format(value)}</b></article>`; }).join('')}</div>
    ${expenseTable(periodExpenses, canPayPayroll, daysUntilClosing)}
    <div class="expense-stats expense-totals-after two-columns"><article class="stat-card"><span>CUSTOS PAGOS</span><strong>${money.format(paidExpenses)}</strong><p class="up">Pagamentos concluídos</p></article><article class="stat-card"><span>CUSTOS PENDENTES</span><strong>${money.format(pendingExpenses)}</strong><p class="down">Valores que ainda serão pagos</p></article></div>
    <article class="monthly-profit ${monthlyProfit >= 0 ? 'positive' : 'negative'}"><div><span>RECEITA DAS MATRÍCULAS DO MÊS</span><strong>${money.format(enrolledRevenue)}</strong></div><i>−</i><div><span>TOTAL DE DESPESAS DO MÊS</span><strong>${money.format(paidExpenses + pendingExpenses)}</strong></div><i>=</i><div><span>LUCRO TOTAL DO MÊS</span><strong>${money.format(monthlyProfit)}</strong></div></article>
    ${expenseHistory(currentMonthKey)}`;
  document.querySelector('#new-expense').addEventListener('click', () => openExpenseModal(period, method, planFilter));
  document.querySelector('#import-expenses').addEventListener('click', () => document.querySelector('#expense-file').click());
  document.querySelector('#expense-file').addEventListener('change', event => importExpenseFile(event.target.files[0], period, method, planFilter));
  document.querySelectorAll('[data-toggle-expense]').forEach(button => button.addEventListener('click', () => { const expense = data.expenses.find(item => item.id === button.dataset.toggleExpense); expense.status = expense.status === 'Pago' ? 'Pendente' : 'Pago'; save(); renderFinance(period, method, planFilter); showToast('Status do custo atualizado.'); }));
  document.querySelectorAll('[data-edit-expense]').forEach(button => button.addEventListener('click', () => openExpenseModal(period, method, planFilter, button.dataset.editExpense)));
  document.querySelectorAll('[data-pay-payroll]').forEach(button => button.addEventListener('click', () => { if (!canPayPayroll) return showToast('O salário só pode ser marcado como pago nos 3 últimos dias do mês.'); const payroll = data.payrollHistory[currentMonthKey]?.find(item => item.id === button.dataset.payPayroll); if (payroll) payroll.status = 'Pago'; save(); renderFinance(period, method, planFilter); showToast('Salário marcado como pago.'); }));
}

function expenseCategoryIcon(category) { return ({ 'Funcionários': '♟', 'Maquinários': '⚙', 'Energia elétrica': 'ϟ', 'Aluguel da academia': '⌂', 'Água': '●', 'Itens extras': '＋' })[category] || '$'; }
function expenseTable(items, canPayPayroll, daysUntilClosing) {
  return `<article class="panel table-panel expense-table"><div class="panel-header"><div><h3>Detalhamento dos custos mensais</h3><p>${items.length} custos agrupados neste mês</p></div></div><div class="responsive-table"><table><thead><tr><th>VENCIMENTO</th><th>CATEGORIA</th><th>DESCRIÇÃO</th><th>STATUS</th><th>VALOR MENSAL</th><th></th></tr></thead><tbody>${items.length ? items.sort((a, b) => a.dueDate.localeCompare(b.dueDate)).map(item => `<tr><td>${item.automatic ? 'Fim do mês' : formatDate(item.dueDate)}</td><td><strong>${expenseCategoryIcon(item.category)} ${escapeHtml(item.category)}</strong></td><td>${escapeHtml(item.description)}${item.automatic ? `<small>${item.status === 'Pago' ? 'Pagamento confirmado' : canPayPayroll ? 'Liberado para pagamento' : `Libera nos 3 últimos dias • faltam ${daysUntilClosing} dias`}</small>` : ''}</td><td><span class="status ${item.status === 'Pago' ? 'status-active' : 'status-pending'}">${item.status}</span></td><td><strong>${money.format(item.amount)}</strong></td><td>${item.automatic ? (item.status === 'Pago' ? '<span class="locked-expense">Pago</span>' : `<button class="row-action" data-pay-payroll="${item.id}" ${canPayPayroll ? '' : 'disabled'}>Marcar como pago</button>`) : `<div class="row-actions"><button class="row-action" data-edit-expense="${item.id}">Editar</button><button class="row-action" data-toggle-expense="${item.id}">${item.status === 'Pago' ? 'Marcar pendente' : 'Marcar pago'}</button></div>`}</td></tr>`).join('') : '<tr><td colspan="6" class="empty">Nenhum custo mensal cadastrado.</td></tr>'}</tbody></table></div></article>`;
}
function expenseHistory(currentMonthKey) {
  const groups = new Map();
  data.expenses.filter(item => item.dueDate.slice(0, 7) < currentMonthKey).forEach(item => { const key = item.dueDate.slice(0, 7); if (!groups.has(key)) groups.set(key, []); groups.get(key).push(item); });
  Object.entries(data.payrollHistory).filter(([month]) => month < currentMonthKey).forEach(([month, items]) => { if (!groups.has(month)) groups.set(month, []); groups.get(month).push(...items); });
  const months = [...groups.entries()].sort(([a], [b]) => b.localeCompare(a));
  return `<section class="expense-history"><div class="finance-section-heading"><div><span class="eyebrow dark">HISTÓRICO</span><h2>Meses anteriores</h2><p>Consulte as despesas e os totais de cada fechamento anterior.</p></div></div>${months.length ? months.map(([month, items]) => { const [year, monthNumber] = month.split('-').map(Number); const label = new Date(year, monthNumber - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }); const total = items.reduce((sum, item) => sum + Number(item.amount), 0); const paid = items.filter(item => item.status === 'Pago').reduce((sum, item) => sum + Number(item.amount), 0); const pending = total - paid; return `<details class="history-month"><summary><div><strong>${label}</strong><small>${items.length} despesas</small></div><div><b>${money.format(total)}</b><small>Pago ${money.format(paid)} • Pendente ${money.format(pending)}</small></div></summary><div class="history-expenses">${items.map(item => `<article><span>${expenseCategoryIcon(item.category)}</span><div><strong>${escapeHtml(item.category)}</strong><small>${escapeHtml(item.description)}</small></div><b>${money.format(item.amount)}</b><i class="status ${item.status === 'Pago' ? 'status-active' : 'status-pending'}">${item.status}</i></article>`).join('')}</div></details>`; }).join('') : '<article class="panel empty-history"><p>Nenhum mês anterior registrado ainda.</p></article>'}</section>`;
}
function openExpenseModal(period, method, planFilter, expenseId = null) {
  const expense = expenseId ? data.expenses.find(item => item.id === expenseId) : null;
  const categories = ['Funcionários', 'Maquinários', 'Energia elétrica', 'Aluguel da academia', 'Água', 'Itens extras'];
  systemModal.innerHTML = `<button class="modal-close" data-close-modal aria-label="Fechar">×</button><span class="eyebrow dark">${expense ? 'EDITAR CUSTO' : 'NOVO CUSTO MENSAL'}</span><h2>${expense ? 'Editar despesa' : 'Adicionar despesa'}</h2><p>O valor será considerado mensal e somado à categoria escolhida.</p><form id="expense-form" class="system-form"><div class="form-grid"><label>Categoria<select name="category">${categories.filter(category => category !== 'Funcionários').map(category => `<option ${expense?.category === category ? 'selected' : ''}>${category}</option>`).join('')}</select></label><label>Valor mensal<input name="amount" type="number" min="0.01" step="0.01" required value="${expense?.amount || ''}"></label><label class="full">Descrição<input name="description" required value="${escapeHtml(expense?.description)}" placeholder="Ex.: Conta de energia"></label><label>Dia/base de vencimento<input name="dueDate" type="date" required value="${expense?.dueDate || isoToday()}"></label><label>Status<select name="status"><option ${expense?.status !== 'Pago' ? 'selected' : ''}>Pendente</option><option ${expense?.status === 'Pago' ? 'selected' : ''}>Pago</option></select></label></div><button class="primary-button" type="submit">${expense ? 'Salvar alterações' : 'Salvar custo mensal'}</button></form>`;
  systemModal.showModal(); systemModal.querySelector('[data-close-modal]').addEventListener('click', () => systemModal.close());
  document.querySelector('#expense-form').addEventListener('submit', event => { event.preventDefault(); const values = Object.fromEntries(new FormData(event.currentTarget)); const record = { id: expense?.id || crypto.randomUUID(), ...values, amount: Number(values.amount), monthly: true }; if (expense) Object.assign(expense, record); else data.expenses.unshift(record); save(); systemModal.close(); renderFinance(period, method, planFilter); showToast(expense ? 'Custo mensal atualizado.' : 'Custo mensal adicionado.'); });
}
async function importExpenseFile(file, period, method, planFilter) {
  if (!file) return;
  try {
    const text = await file.text(); let imported = [];
    if (file.name.toLowerCase().endsWith('.json')) {
      const parsed = JSON.parse(text); imported = (Array.isArray(parsed) ? parsed : parsed.expenses || []).map(item => ({ category: item.category, description: item.description, amount: Number(item.amount), dueDate: item.dueDate || isoToday(), status: item.status === 'Pago' ? 'Pago' : 'Pendente' }));
    } else {
      const lines = text.split(/\r?\n/).filter(Boolean); const parseLine = line => { const cells = []; let value = '', quoted = false; for (let index = 0; index < line.length; index++) { const char = line[index]; if (char === '"' && line[index + 1] === '"') { value += '"'; index++; } else if (char === '"') quoted = !quoted; else if (char === ';' && !quoted) { cells.push(value); value = ''; } else value += char; } cells.push(value); return cells; };
      imported = lines.slice(1).map(parseLine).filter(row => row[0]?.toLowerCase().includes('despesa')).map(row => { const [category, ...description] = (row[2] || '').split(' • '); return { category, description: description.join(' • ') || category, amount: Number(String(row[5] || '0').replace(/\./g, '').replace(',', '.')), dueDate: isoToday(), status: row[4] === 'Pago' ? 'Pago' : 'Pendente' }; });
    }
    const allowed = ['Maquinários', 'Energia elétrica', 'Aluguel da academia', 'Água', 'Itens extras']; imported = imported.filter(item => allowed.includes(item.category) && Number.isFinite(item.amount));
    if (!imported.length) return showToast('Nenhuma despesa válida encontrada no arquivo.');
    imported.forEach(item => data.expenses.unshift({ id: crypto.randomUUID(), ...item, monthly: true })); save(); renderFinance(period, method, planFilter); showToast(`${imported.length} despesas importadas.`);
  } catch { showToast('Não foi possível importar o arquivo. Verifique o formato.'); }
}

function groupTransactions(items, period) {
  const map = new Map();
  items.filter(item => item.status === 'Recebido').forEach(item => { const date = new Date(`${item.date}T12:00:00`); const key = period === 'year' ? `${date.getFullYear()}-${date.getMonth()}` : item.date; const label = period === 'year' ? date.toLocaleDateString('pt-BR', { month: 'short' }) : date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }); map.set(key, { label, total: (map.get(key)?.total || 0) + Number(item.amount) }); });
  return [...map.values()];
}

function transactionTable(items) {
  return `<article class="panel table-panel"><div class="panel-header"><div><h3>Detalhamento das entradas</h3><p>${items.length} lançamentos encontrados</p></div></div><div class="responsive-table"><table><thead><tr><th>DATA</th><th>DESCRIÇÃO</th><th>FORMA DE PAGAMENTO</th><th>STATUS</th><th>VALOR</th></tr></thead><tbody>${items.length ? items.map(item => `<tr><td>${formatDate(item.date)}</td><td><strong>${escapeHtml(item.description)}</strong></td><td>${escapeHtml(item.method)}</td><td><span class="status ${item.status === 'Recebido' ? 'status-active' : 'status-pending'}">${item.status}</span></td><td><strong>${money.format(item.amount)}</strong></td></tr>`).join('') : '<tr><td colspan="5" class="empty">Nenhum lançamento no período.</td></tr>'}</tbody></table></div></article>`;
}

function renderPayments(period = 'month', method = 'all', planFilter = 'all') {
  const now = new Date();
  const items = data.transactions.filter(item => { const date = new Date(`${item.date}T12:00:00`); const student = data.students.find(entry => entry.id === item.studentId); const inPeriod = period === 'day' ? item.date === isoToday() : period === 'year' ? date.getFullYear() === now.getFullYear() : date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear(); return inPeriod && (method === 'all' || item.method === method) && (planFilter === 'all' || student?.plan === planFilter); });
  const groups = groupTransactions(items, period); const max = Math.max(...groups.map(group => group.total), 1);
  const received = items.filter(item => item.status === 'Recebido').reduce((sum, item) => sum + Number(item.amount), 0);
  const pending = items.filter(item => item.status === 'Pendente').reduce((sum, item) => sum + Number(item.amount), 0);
  const payingStudents = new Set(items.filter(item => item.status === 'Recebido').map(item => item.studentId)).size;
  const overdueItems = items.filter(item => item.status === 'Pendente');
  const overdueStudents = new Set(overdueItems.map(item => item.studentId)).size;
  dashboardContent.innerHTML = `${heading('MENSALIDADES', 'Mensalidades e entradas', 'Acompanhe os pagamentos e recebimentos dos alunos.', '<button class="outline-button" id="export-payments">↧ Exportar planilha filtrada</button>')}
    <div class="toolbar finance-filters"><label>Período<select id="payments-period" class="period-select"><option value="day" ${period === 'day' ? 'selected' : ''}>Hoje</option><option value="month" ${period === 'month' ? 'selected' : ''}>Este mês</option><option value="year" ${period === 'year' ? 'selected' : ''}>Este ano</option></select></label><label>Forma de pagamento<select id="payments-method" class="period-select"><option value="all">Todas</option>${['PIX', 'Cartão de crédito', 'Cartão de débito', 'Dinheiro', 'Boleto'].map(value => `<option ${method === value ? 'selected' : ''}>${value}</option>`).join('')}</select></label><label>Plano<select id="payments-plan" class="period-select"><option value="all">Todos os planos</option>${plans.map(plan => `<option value="${plan.id}" ${planFilter === plan.id ? 'selected' : ''}>${plan.name}</option>`).join('')}</select></label></div>
    <div class="finance-stats payment-stats"><article class="stat-card"><span>TOTAL ARRECADADO NO MÊS</span><strong>${money.format(received)}</strong><p class="up">Mensalidades recebidas</p></article><article class="stat-card"><span>ALUNOS PAGANTES</span><strong>${payingStudents}</strong><p class="up">Pagamentos confirmados</p></article><article class="stat-card"><span>ALUNOS EM ATRASO</span><strong>${overdueStudents}</strong><p class="down">${money.format(pending)} pendentes</p></article></div>
    <article class="panel finance-chart"><div class="panel-header"><div><h3>Gráfico de mensalidades</h3><p>Valores recebidos no período selecionado</p></div></div><div class="live-chart finance-bars">${groups.length ? groups.map(group => `<div class="chart-column"><span>${money.format(group.total)}</span><b style="height:${30 + group.total / max * 150}px"></b><small>${group.label}</small></div>`).join('') : '<p class="empty">Sem pagamentos neste período.</p>'}</div></article>
    ${overdueStudentsTable(overdueItems)}${paymentTable(items)}`;
  const refresh = () => renderPayments(document.querySelector('#payments-period').value, document.querySelector('#payments-method').value, document.querySelector('#payments-plan').value);
  document.querySelectorAll('#payments-period,#payments-method,#payments-plan').forEach(select => select.addEventListener('change', refresh));
  document.querySelector('#export-payments').addEventListener('click', () => exportPaymentsCsv(items, period));
  document.querySelectorAll('[data-whatsapp-overdue]').forEach(button => button.addEventListener('click', () => sendOverdueWhatsApp(button.dataset.whatsappOverdue, button.dataset.transactionId)));
}

function paymentTable(items) {
  return `<article class="panel table-panel payment-table"><div class="panel-header"><div><h3>Mensalidades dos alunos</h3><p>${items.length} lançamentos encontrados</p></div></div><div class="responsive-table"><table><thead><tr><th>ALUNO</th><th>PLANO CADASTRADO</th><th>INÍCIO DO PLANO</th><th>FINAL DO PLANO</th><th>PAGAMENTO</th><th>STATUS</th><th>VALOR</th></tr></thead><tbody>${items.length ? items.map(item => { const student = data.students.find(entry => entry.id === item.studentId); const plan = plans.find(entry => entry.id === student?.plan); return `<tr><td><strong>${escapeHtml(student?.name || 'Aluno não encontrado')}</strong><small>${escapeHtml(student?.cpf || '')}</small></td><td><strong>${escapeHtml(plan?.name || '—')}</strong></td><td>${formatDate(student?.start)}</td><td>${formatDate(student?.end)}</td><td>${escapeHtml(item.method)}</td><td><span class="status ${item.status === 'Recebido' ? 'status-active' : 'status-pending'}">${item.status}</span></td><td><strong>${money.format(item.amount)}</strong></td></tr>`; }).join('') : '<tr><td colspan="7" class="empty">Nenhuma mensalidade encontrada com estes filtros.</td></tr>'}</tbody></table></div></article>`;
}
function exportPaymentsCsv(items, period) {
  const total = items.filter(item => item.status === 'Recebido').reduce((sum, item) => sum + Number(item.amount), 0);
  const monthKey = isoToday().slice(0, 7); const expenses = data.expenses.filter(item => item.dueDate.slice(0, 7) === monthKey).reduce((sum, item) => sum + Number(item.amount), 0) + data.employees.filter(employee => employee.active !== false).reduce((sum, employee) => sum + Number(employee.salary || 0), 0); const profit = total - expenses;
  const rows = [['Aluno', 'CPF', 'Plano', 'Início do plano', 'Final do plano', 'Forma de pagamento', 'Status', 'Valor'], ...items.map(item => { const student = data.students.find(entry => entry.id === item.studentId); const plan = plans.find(entry => entry.id === student?.plan); return [student?.name || '', student?.cpf || '', plan?.name || '', formatDate(student?.start), formatDate(student?.end), item.method, item.status, Number(item.amount).toFixed(2).replace('.', ',')]; }), ['', '', '', '', '', '', 'TOTAL ARRECADADO', total.toFixed(2).replace('.', ',')], ['', '', '', '', '', '', 'DESPESAS DO MÊS', expenses.toFixed(2).replace('.', ',')], ['', '', '', '', '', '', 'LUCRO FILTRADO', profit.toFixed(2).replace('.', ',')]];
  const csv = '\ufeff' + rows.map(row => row.map(cell => `"${String(cell).replaceAll('"', '""')}"`).join(';')).join('\n'); const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); link.download = `mensalidades-${period}-${isoToday()}.csv`; link.click(); URL.revokeObjectURL(link.href); showToast('Planilha dos filtros atuais exportada.');
}

function overdueStudentsTable(items) {
  const unique = [...new Map(items.map(item => [item.studentId, item])).values()];
  return `<article class="panel table-panel overdue-panel"><div class="panel-header"><div><h3>Alunos com mensalidade em atraso</h3><p>Envie um lembrete de pagamento diretamente pelo WhatsApp.</p></div></div><div class="responsive-table"><table><thead><tr><th>ALUNO</th><th>TELEFONE</th><th>VENCIMENTO</th><th>VALOR PENDENTE</th><th></th></tr></thead><tbody>${unique.length ? unique.map(item => { const student = data.students.find(entry => entry.id === item.studentId); return `<tr><td><strong>${escapeHtml(student?.name || 'Aluno não encontrado')}</strong><small>${escapeHtml(student?.cpf || '')}</small></td><td>${escapeHtml(student?.phone || 'Sem telefone')}</td><td>${formatDate(item.date)}</td><td><strong>${money.format(item.amount)}</strong></td><td><button class="whatsapp-button" data-whatsapp-overdue="${student?.id || ''}" data-transaction-id="${item.id}" ${student?.phone ? '' : 'disabled'}>◉ Enviar alerta no WhatsApp</button></td></tr>`; }).join('') : '<tr><td colspan="5" class="empty">Nenhum aluno com mensalidade em atraso neste período.</td></tr>'}</tbody></table></div></article>`;
}
function sendOverdueWhatsApp(studentId, transactionId) {
  const student = data.students.find(item => item.id === studentId); const transaction = data.transactions.find(item => item.id === transactionId); if (!student?.phone || !transaction) return showToast('O aluno não possui telefone cadastrado.');
  const phone = student.phone.replace(/\D/g, ''); const number = phone.startsWith('55') ? phone : `55${phone}`;
  const message = `Olá, ${student.name}! Identificamos que sua mensalidade no valor de ${money.format(transaction.amount)} está vencida. Por favor, entre em contato com a RR Academia para regularizar o pagamento. Caso já tenha pago, desconsidere esta mensagem.`;
  window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
}

function renderNotifications() {
  const ordered = data.notifications.slice().sort((a, b) => (b.createdAt || b.date).localeCompare(a.createdAt || a.date));
  const featured = ordered[0];
  dashboardContent.innerHTML = `${heading('COMUNICAÇÃO', 'Notificações', 'Crie e acompanhe os alertas enviados aos alunos.', '<button class="primary-action" id="new-notification">＋ Criar nova notificação</button>')}
    ${featured ? `<article class="notification-hero" style="background-image:linear-gradient(90deg,rgba(10,10,11,.97) 0%,rgba(10,10,11,.88) 42%,rgba(10,10,11,.08) 75%),url('${escapeHtml(featured.image || 'notification-holiday.png')}')"><div><span class="notification-tag">⚠ ${escapeHtml(featured.priority)}</span><h2>${escapeHtml(featured.title)}</h2><p>${escapeHtml(featured.message)}</p><strong>◷ ${formatDate(featured.date)} · ${escapeHtml(featured.audience)}</strong></div></article>` : ''}
    <div class="notification-summary"><article><span>NOTIFICAÇÕES ATIVAS</span><strong>${data.notifications.length}</strong></article><article><span>DESTINATÁRIOS</span><strong>${data.students.filter(student => student.active).length} alunos</strong></article><article><span>PRÓXIMO ALERTA</span><strong>${featured ? formatDate(featured.date) : '—'}</strong></article></div>
    <article class="panel notification-list-panel"><div class="panel-header"><div><h3>Lista de notificações</h3><p>Histórico de comunicados para os alunos</p></div></div><div class="notification-list">${ordered.length ? ordered.map(item => `<article><div class="notification-thumb" style="background-image:url('${escapeHtml(item.image || 'notification-holiday.png')}')"></div><div class="notification-copy"><span class="status status-pending">${escapeHtml(item.priority)}</span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.message)}</p><small>◷ ${formatDate(item.date)} · ${escapeHtml(item.audience)}</small></div><button class="row-action" data-delete-notification="${item.id}">Excluir</button></article>`).join('') : '<p class="empty">Nenhuma notificação criada.</p>'}</div></article>`;
  document.querySelector('#new-notification').addEventListener('click', openNotificationModal);
  document.querySelectorAll('[data-delete-notification]').forEach(button => button.addEventListener('click', () => {
    data.notifications = data.notifications.filter(item => item.id !== button.dataset.deleteNotification);
    save(); renderNotifications(); showToast('Notificação excluída.');
  }));
}

function openNotificationModal() {
  systemModal.innerHTML = `<button class="modal-close" data-close-modal aria-label="Fechar">×</button><span class="eyebrow dark">NOVO ALERTA</span><h2>Criar notificação</h2><p>O comunicado ficará disponível para os alunos na lista de alertas.</p><form id="notification-form" class="system-form"><div class="form-grid"><label class="full">Título<input name="title" required placeholder="Ex.: Horário especial"></label><label>Data do aviso<input name="date" type="date" required value="${isoToday()}"></label><label>Prioridade<select name="priority"><option>Importante</option><option>Informativo</option><option>Urgente</option></select></label><label class="full">Público<select name="audience"><option>Todos os alunos</option><option>Alunos ativos</option><option>Alunos com mensalidade pendente</option></select></label><label class="full">Mensagem<textarea name="message" required rows="5" placeholder="Escreva o alerta que será enviado aos alunos"></textarea></label><label class="switch-field full"><input name="useImage" type="checkbox" checked> Usar imagem ilustrativa no alerta</label></div><button class="primary-button" type="submit">Publicar notificação</button></form>`;
  systemModal.showModal();
  systemModal.querySelector('[data-close-modal]').addEventListener('click', () => systemModal.close());
  document.querySelector('#notification-form').addEventListener('submit', event => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    data.notifications.unshift({ id: crypto.randomUUID(), title: values.title.trim(), message: values.message.trim(), date: values.date, audience: values.audience, priority: values.priority, image: values.useImage ? 'notification-holiday.png' : '', createdAt: new Date().toISOString() });
    save(); systemModal.close(); renderNotifications(); showToast('Notificação publicada com sucesso.');
  });
}

function exportCsv(items) {
  const rows = [['Data', 'Descrição', 'Forma de pagamento', 'Status', 'Valor'], ...items.map(item => [formatDate(item.date), item.description, item.method, item.status, Number(item.amount).toFixed(2).replace('.', ',')])];
  const csv = '\ufeff' + rows.map(row => row.map(cell => `"${String(cell).replaceAll('"', '""')}"`).join(';')).join('\n');
  const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); link.download = `financeiro-rr-${isoToday()}.csv`; link.click(); URL.revokeObjectURL(link.href); showToast('Planilha exportada com sucesso.');
}
function exportFinancialCsv(entries, expenses) {
  const rows = [['TIPO', 'Data/Vencimento', 'Categoria/Descrição', 'Forma de pagamento', 'Status', 'Valor mensal'], ...entries.map(item => ['Entrada', formatDate(item.date), item.description, item.method, item.status, Number(item.amount).toFixed(2).replace('.', ',')]), ...expenses.map(item => ['Despesa mensal', item.automatic ? 'Mensal' : formatDate(item.dueDate), `${item.category} • ${item.description}`, item.automatic ? 'Folha automática' : 'Custo cadastrado', item.status, Number(item.amount).toFixed(2).replace('.', ',')])];
  const csv = '\ufeff' + rows.map(row => row.map(cell => `"${String(cell).replaceAll('"', '""')}"`).join(';')).join('\n');
  const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); link.download = `financeiro-completo-rr-${isoToday()}.csv`; link.click(); URL.revokeObjectURL(link.href); showToast('Entradas e despesas exportadas com sucesso.');
}

function renderAgenda() {
  const year = agendaMonth.getFullYear();
  const month = agendaMonth.getMonth();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const previousDays = new Date(year, month, 0).getDate();
  const monthLabel = agendaMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const cells = [];
  for (let index = 0; index < 42; index++) {
    let day;
    let cellMonth = month;
    let cellYear = year;
    let outside = false;
    if (index < firstWeekday) { day = previousDays - firstWeekday + index + 1; cellMonth--; outside = true; if (cellMonth < 0) { cellMonth = 11; cellYear--; } }
    else if (index >= firstWeekday + daysInMonth) { day = index - firstWeekday - daysInMonth + 1; cellMonth++; outside = true; if (cellMonth > 11) { cellMonth = 0; cellYear++; } }
    else day = index - firstWeekday + 1;
    const date = `${cellYear}-${String(cellMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const events = data.schedules.filter(event => event.date === date);
    const isToday = date === isoToday();
    const isSelected = date === selectedAgendaDate;
    cells.push(`<button class="calendar-day ${outside ? 'outside' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}" data-calendar-date="${date}"><span class="day-number">${day}${isToday ? '<i>HOJE</i>' : ''}</span><div class="day-events">${events.slice(0, 3).map(event => `<span class="calendar-event period-${event.period.toLowerCase().replace('ã', 'a')}"><b>${event.time}</b> ${escapeHtml(event.activity)}</span>`).join('')}${events.length > 3 ? `<small>+${events.length - 3} atividades</small>` : ''}</div></button>`);
  }
  const selectedEvents = data.schedules.filter(event => event.date === selectedAgendaDate).sort((a, b) => a.time.localeCompare(b.time));
  dashboardContent.innerHTML = `${heading('AGENDA', 'Calendário de aulas', 'Veja tudo o que acontecerá em cada dia.')}
    <div class="calendar-layout"><article class="panel calendar-panel"><div class="calendar-header"><button id="prev-month" aria-label="Mês anterior">‹</button><h2>${monthLabel}</h2><button id="next-month" aria-label="Próximo mês">›</button></div><div class="weekdays">${['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'].map(day => `<span>${day}</span>`).join('')}</div><div class="calendar-grid">${cells.join('')}</div></article>
    <aside class="panel day-details"><span class="eyebrow dark">PROGRAMAÇÃO DO DIA</span><h2>${formatDate(selectedAgendaDate)}</h2><p>${selectedEvents.length} ${selectedEvents.length === 1 ? 'atividade agendada' : 'atividades agendadas'}</p><button class="primary-action day-event-button" id="new-schedule">＋ Criar evento neste dia</button><div class="schedule-list">${selectedEvents.length ? selectedEvents.map(event => `<article><div class="schedule-time"><strong>${event.time}</strong><span>${event.period}</span></div><i></i><div><strong>${escapeHtml(event.activity)}</strong><span>${escapeHtml(event.instructor)}</span></div></article>`).join('') : '<div class="no-schedule">Nenhuma atividade programada para este dia.</div>'}</div></aside></div>`;
  document.querySelector('#prev-month').addEventListener('click', () => { agendaMonth = new Date(year, month - 1, 1); renderAgenda(); });
  document.querySelector('#next-month').addEventListener('click', () => { agendaMonth = new Date(year, month + 1, 1); renderAgenda(); });
  document.querySelectorAll('[data-calendar-date]').forEach(button => button.addEventListener('click', () => { selectedAgendaDate = button.dataset.calendarDate; const picked = new Date(`${selectedAgendaDate}T12:00:00`); if (picked.getMonth() !== month) agendaMonth = new Date(picked.getFullYear(), picked.getMonth(), 1); renderAgenda(); }));
  document.querySelector('#new-schedule').addEventListener('click', openScheduleModal);
}

function openScheduleModal() {
  systemModal.innerHTML = `<button class="modal-close" data-close-modal aria-label="Fechar">×</button><span class="eyebrow dark">NOVO EVENTO</span><h2>Criar evento</h2><p>O evento será incluído em ${formatDate(selectedAgendaDate)}.</p><form id="schedule-form" class="system-form"><div class="form-grid"><label class="full">Atividade ou evento<input name="activity" required placeholder="Ex.: Aula de funcional"></label><label>Horário<input name="time" id="schedule-time" type="time" required></label><label>Período<select name="period" id="schedule-period"><option>Manhã</option><option>Tarde</option><option>Noite</option></select></label><label class="full">Responsável / instrutor<input name="instructor" required placeholder="Ex.: Prof. João"></label></div><button class="primary-button" type="submit">Criar evento</button></form>`;
  systemModal.showModal();
  systemModal.querySelector('[data-close-modal]').addEventListener('click', () => systemModal.close());
  const updateSchedulePeriod = () => { const hour = Number(document.querySelector('#schedule-time').value.split(':')[0]); document.querySelector('#schedule-period').value = hour < 12 ? 'Manhã' : hour < 18 ? 'Tarde' : 'Noite'; };
  document.querySelector('#schedule-time').addEventListener('change', updateSchedulePeriod);
  document.querySelector('#schedule-form').addEventListener('submit', event => { event.preventDefault(); updateSchedulePeriod(); const values = Object.fromEntries(new FormData(event.currentTarget)); data.schedules.push({ id: crypto.randomUUID(), date: selectedAgendaDate, ...values }); save(); systemModal.close(); renderAgenda(); showToast('Evento criado na agenda.'); });
}

function renderSettings() {
  const settings = data.settings;
  dashboardContent.innerHTML = `${heading('CONFIGURAÇÕES', 'Configurações da academia', 'Atualize as informações gerais e preferências do sistema.')}
    <article class="panel settings-panel"><form id="settings-form" class="system-form"><div class="settings-section"><h3>Dados da academia</h3><p>Informações usadas nos relatórios e documentos.</p><div class="form-grid"><label>Nome da academia<input name="academy" value="${escapeHtml(settings.academy)}" required></label><label>CNPJ / CPF<input name="document" value="${escapeHtml(settings.document)}"></label><label>Telefone<input name="phone" value="${escapeHtml(settings.phone)}"></label><label>E-mail<input name="email" type="email" value="${escapeHtml(settings.email)}"></label><label class="full">Endereço<input name="address" value="${escapeHtml(settings.address)}"></label></div></div><div class="settings-section"><h3>Localização para registro de ponto</h3><p>Informe as coordenadas da academia e o raio permitido em metros.</p><div class="form-grid"><label>Latitude<input name="latitude" type="number" step="any" required value="${escapeHtml(settings.latitude)}"></label><label>Longitude<input name="longitude" type="number" step="any" required value="${escapeHtml(settings.longitude)}"></label><label>Raio permitido (metros)<input name="allowedRadius" type="number" min="20" required value="${escapeHtml(settings.allowedRadius)}"></label></div></div><div class="settings-section"><h3>Preferências</h3><label class="switch-field"><input name="notifications" type="checkbox" ${settings.notifications ? 'checked' : ''}> Receber alertas de vencimentos e pagamentos</label></div><div class="settings-actions"><button class="primary-action" type="submit">Salvar configurações</button><button class="settings-logout-button" id="settings-logout-button" type="button">↪ Sair</button></div></form></article>`;
  document.querySelector('#settings-form').addEventListener('submit', event => { event.preventDefault(); const values = Object.fromEntries(new FormData(event.currentTarget)); data.settings = { ...values, notifications: values.notifications === 'on' }; save(); showToast('Configurações salvas com sucesso.'); });
  document.querySelector('#settings-logout-button').addEventListener('click', openLogoutConfirmation);
}

let toastTimer;
function showToast(message) { const toast = document.querySelector('#toast'); toast.textContent = message; toast.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 2600); }
updateBadges();
