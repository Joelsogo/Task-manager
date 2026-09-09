(function () {
'use strict';
let tasks = JSON.parse(localStorage.getItem('apex_tasks')) || [];
let habits = JSON.parse(localStorage.getItem('apex_habits')) || [0, 0, 0, 0, 0, 0, 0];
let dismissedNotifs = JSON.parse(localStorage.getItem('apex_dismissed_notifs')) || [];
let currentFilter = 'all';
let editingId = null;
let currentView = 'dashboard';
const CATEGORIES = ['work', 'personal', 'health', 'learning', 'strategy'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];
const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);
function init() {
if (tasks.length === 0) seedSampleData();
setupNavigation();
setupEventListeners();
setupNotifications();
updateGreeting();
renderAll();
updateNotifications();
detectLayout();
window.addEventListener('resize', debounce(detectLayout, 150));
setupWellbeing();
}
function detectLayout() {
const isDesktop = window.matchMedia('(min-width: 768px)').matches;
document.body.classList.toggle('is-desktop', isDesktop);
document.body.classList.toggle('is-mobile', !isDesktop);
}
function debounce(fn, ms) {
let t;
return function () {
clearTimeout(t);
t = setTimeout(fn, ms);
};
}
function seedSampleData() {
const today = new Date();
const fmt = (d) => d.toISOString().slice(0, 10);
tasks = [
{ id: uid(), title: 'Review Q3 strategy deck with leadership', category: 'strategy', priority: 'critical', due: fmt(today), completed: false, created: Date.now() },
{ id: uid(), title: 'Finalize board presentation narrative', category: 'work', priority: 'high', due: fmt(addDays(today, 1)), completed: false, created: Date.now() },
{ id: uid(), title: 'Morning executive brief — market scan', category: 'work', priority: 'high', due: fmt(today), completed: true, created: Date.now() },
{ id: uid(), title: 'Schedule 1:1s with direct reports', category: 'work', priority: 'medium', due: fmt(addDays(today, 2)), completed: false, created: Date.now() },
{ id: uid(), title: '30-min focused reading block', category: 'learning', priority: 'medium', due: fmt(today), completed: false, created: Date.now() },
{ id: uid(), title: 'Evening recovery walk', category: 'health', priority: 'low', due: fmt(today), completed: false, created: Date.now() },
{ id: uid(), title: 'Family dinner — no devices', category: 'personal', priority: 'medium', due: fmt(addDays(today, 1)), completed: false, created: Date.now() }
];
const dow = (today.getDay() + 6) % 7;
for (let i = 0; i <= dow; i++) {
habits[i] = i % 2 === 0 || i === dow ? 1 : 0;
}
persist();
}
function uid() {
return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
function addDays(d, n) {
const x = new Date(d);
x.setDate(x.getDate() + n);
return x;
}
function persist() {
localStorage.setItem('apex_tasks', JSON.stringify(tasks));
localStorage.setItem('apex_habits', JSON.stringify(habits));
}
function setupNavigation() {
$$('.nav-item, .side-nav-item').forEach((btn) => {
btn.addEventListener('click', () => {
const view = btn.dataset.view;
if (view) switchView(view);
});
});
$$('[data-nav]').forEach((btn) => {
btn.addEventListener('click', () => switchView(btn.dataset.nav));
});
$('#ask-ai-btn')?.addEventListener('click', () => switchView('ai'));
$('#profile-btn')?.addEventListener('click', () => switchView('profile'));
}
function switchView(view) {
currentView = view;
$$('.view').forEach((v) => v.classList.remove('active'));
$$('.nav-item').forEach((n) => n.classList.remove('active'));
$$('.side-nav-item').forEach((n) => n.classList.remove('active'));
const target = $(`#view-${view}`);
if (target) target.classList.add('active');
const nav = $(`.nav-item[data-view="${view}"]`);
if (nav) nav.classList.add('active');
const side = $(`.side-nav-item[data-view="${view}"]`);
if (side) side.classList.add('active');
closeNotifPanel();
if (view === 'dashboard') renderDashboard();
if (view === 'tasks') renderTasks();
if (view === 'habits') renderHabits();
if (view === 'ai') {
const chat = $('#ai-chat');
if (chat) chat.scrollTop = chat.scrollHeight;
}
}
function updateGreeting() {
const now = new Date();
const h = now.getHours();
let g = 'Good evening';
if (h < 12) g = 'Good morning';
else if (h < 17) g = 'Good afternoon';
const el = $('#greeting-time');
if (el) el.textContent = g;
const dateEl = $('#current-date');
if (dateEl) {
dateEl.textContent = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}
}
function renderAll() {
renderDashboard();
renderTasks();
renderHabits();
updateNotifications();
}
function buildNotifications() {
const todayStr = new Date().toISOString().slice(0, 10);
const items = [];
tasks.forEach((t) => {
if (t.completed) return;
if (t.due && t.due < todayStr) {
items.push({ id: 'overdue-' + t.id, taskId: t.id, type: 'overdue', title: t.title, msg: 'Overdue — was due ' + formatDue(t.due), time: 'Due' });
} else if (t.due === todayStr) {
items.push({ id: 'due-' + t.id, taskId: t.id, type: 'due', title: t.title, msg: 'Due today · ' + t.priority + ' priority', time: 'Today' });
} else if (t.priority === 'critical' || t.priority === 'high') {
items.push({ id: 'prio-' + t.id, taskId: t.id, type: 'priority', title: t.title, msg: t.priority.charAt(0).toUpperCase() + t.priority.slice(1) + ' priority · ' + (t.category || ''), time: t.due ? formatDue(t.due) : 'Open' });
}
});
const order = { overdue: 0, due: 1, priority: 2 };
items.sort((a, b) => (order[a.type] || 9) - (order[b.type] || 9));
const seen = new Set();
const unique = [];
for (const n of items) {
if (seen.has(n.taskId)) continue;
seen.add(n.taskId);
if (!dismissedNotifs.includes(n.id)) unique.push(n);
}
return unique;
}
function updateNotifications() {
const list = buildNotifications();
const badge = $('#notif-badge');
const listEl = $('#notif-list');
const emptyEl = $('#notif-empty');
if (badge) {
if (list.length > 0) {
badge.textContent = list.length > 9 ? '9+' : String(list.length);
badge.classList.remove('hidden');
} else {
badge.classList.add('hidden');
}
}
if (!listEl) return;
if (list.length === 0) {
listEl.innerHTML = '';
emptyEl?.classList.remove('hidden');
return;
}
emptyEl?.classList.add('hidden');
const iconMap = { overdue: 'fa-exclamation-circle', due: 'fa-clock', priority: 'fa-flag', info: 'fa-info-circle' };
listEl.innerHTML = list.map((n) => `
<button type="button" class="notif-item unread" data-notif-id="${n.id}" data-task-id="${n.taskId}">
<div class="notif-icon ${n.type}"><i class="fas ${iconMap[n.type] || iconMap.info}"></i></div>
<div class="notif-body">
<div class="notif-title">${escapeHtml(n.title)}</div>
<div class="notif-msg">${escapeHtml(n.msg)}</div>
</div>
<span class="notif-time">${escapeHtml(n.time)}</span>
</button>`).join('');
}
function setupNotifications() {
const btn = $('#notif-btn');
const panel = $('#notif-panel');
btn?.addEventListener('click', (e) => {
e.stopPropagation();
const open = panel?.classList.toggle('open');
btn.setAttribute('aria-expanded', open ? 'true' : 'false');
if (open) updateNotifications();
});
$('#notif-clear')?.addEventListener('click', (e) => {
e.stopPropagation();
const list = buildNotifications();
list.forEach((n) => { if (!dismissedNotifs.includes(n.id)) dismissedNotifs.push(n.id); });
localStorage.setItem('apex_dismissed_notifs', JSON.stringify(dismissedNotifs));
updateNotifications();
closeNotifPanel();
});
$('#notif-list')?.addEventListener('click', (e) => {
const item = e.target.closest('.notif-item');
if (!item) return;
const notifId = item.dataset.notifId;
if (notifId && !dismissedNotifs.includes(notifId)) {
dismissedNotifs.push(notifId);
localStorage.setItem('apex_dismissed_notifs', JSON.stringify(dismissedNotifs));
}
closeNotifPanel();
switchView('tasks');
updateNotifications();
});
document.addEventListener('click', (e) => { if (!e.target.closest('.notif-wrap')) closeNotifPanel(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeNotifPanel(); });
}
function closeNotifPanel() {
$('#notif-panel')?.classList.remove('open');
$('#notif-btn')?.setAttribute('aria-expanded', 'false');
}
function renderDashboard() {
const active = tasks.filter((t) => !t.completed);
const done = tasks.filter((t) => t.completed);
const total = tasks.length;
const rate = total ? Math.round((done.length / total) * 100) : 0;
const streak = habits.filter(Boolean).length;
setText('kpi-focus', active.length);
setText('kpi-done', done.length);
setText('kpi-rate', rate + '%');
setText('kpi-streak', streak);
const todayStr = new Date().toISOString().slice(0, 10);
const todayTasks = tasks.filter((t) => t.due === todayStr);
const todayDone = todayTasks.filter((t) => t.completed).length;
const todayTotal = todayTasks.length || 1;
const pct = Math.round((todayDone / todayTotal) * 100);
setText('ring-pct', pct + '%');
setText('progress-meta', `${todayDone} of ${todayTasks.length}`);
const ring = $('#progress-ring');
if (ring) {
const circ = 2 * Math.PI * 52;
ring.style.strokeDasharray = circ;
ring.style.strokeDashoffset = circ - (pct / 100) * circ;
}
const priority = active.filter((t) => t.priority === 'critical' || t.priority === 'high').slice(0, 4);
const list = $('#priority-list');
if (!list) return;
if (priority.length === 0) {
list.innerHTML = '<div class="empty-mini">No high-priority items. You are clear.</div>';
} else {
list.innerHTML = priority.map((t) => `
<div class="priority-item ${t.completed ? 'completed' : ''}" data-id="${t.id}">
<span class="prio-dot ${t.priority}"></span>
<span class="priority-title">${escapeHtml(t.title)}</span>
<span class="priority-cat">${t.category}</span>
</div>`).join('');
}
generateInsight();
renderHabitStrip();
}
function generateInsight() {
const el = $('#ai-insight-text');
if (!el) return;
const active = tasks.filter((t) => !t.completed);
const critical = active.filter((t) => t.priority === 'critical');
const high = active.filter((t) => t.priority === 'high');
const todayStr = new Date().toISOString().slice(0, 10);
const dueToday = active.filter((t) => t.due === todayStr);
let text = '';
if (critical.length > 0) {
text = `You have ${critical.length} critical item${critical.length > 1 ? 's' : ''} requiring attention. Lead with "${critical[0].title}" to protect strategic momentum.`;
} else if (dueToday.length > 0) {
text = `${dueToday.length} task${dueToday.length > 1 ? 's' : ''} due today. Sequence them by priority and protect a 90-minute deep-work block.`;
} else if (high.length > 0) {
text = `No critical fires. Your ${high.length} high-priority items are the right focus.`;
} else if (active.length === 0) {
text = 'Inbox zero on open tasks. Use this window to plan next week or invest in a learning block.';
} else {
text = `${active.length} open tasks. Maintain cadence and review priorities mid-week.`;
}
el.textContent = text;
}
function renderHabitStrip() {
const strip = $('#habit-strip');
if (!strip) return;
const todayIdx = (new Date().getDay() + 6) % 7;
strip.innerHTML = DAYS.map((d, i) => {
const cls = ['habit-day-mini', habits[i] ? 'active' : '', i === todayIdx ? 'today' : ''].join(' ');
return `<div class="${cls}">${d}</div>`;
}).join('');
}
function renderTasks() {
const list = $('#task-list');
if (!list) return;
let filtered = [...tasks];
if (currentFilter === 'active') filtered = filtered.filter((t) => !t.completed);
else if (currentFilter === 'completed') filtered = filtered.filter((t) => t.completed);
else if (currentFilter === 'priority') filtered = filtered.filter((t) => !t.completed && (t.priority === 'high' || t.priority === 'critical'));
const pWeight = { critical: 0, high: 1, medium: 2, low: 3 };
filtered.sort((a, b) => {
if (a.completed !== b.completed) return a.completed ? 1 : -1;
return (pWeight[a.priority] || 9) - (pWeight[b.priority] || 9);
});
if (filtered.length === 0) {
list.innerHTML = `<div class="empty-state"><i class="fas fa-clipboard-check"></i><p>No tasks in this view.</p></div>`;
return;
}
const todayStr = new Date().toISOString().slice(0, 10);
list.innerHTML = filtered.map((t) => {
const overdue = t.due && t.due < todayStr && !t.completed;
return `
<div class="task-item ${t.completed ? 'completed' : ''}" data-id="${t.id}">
<input type="checkbox" class="task-check" ${t.completed ? 'checked' : ''} data-action="toggle">
<div class="task-body">
<div class="task-title">${escapeHtml(t.title)}</div>
<div class="task-meta">
<span class="task-tag ${t.category}">${t.category}</span>
<span class="task-tag">${t.priority}</span>
${t.due ? `<span class="task-due ${overdue ? 'overdue' : ''}"><i class="far fa-calendar"></i> ${formatDue(t.due)}</span>` : ''}
</div>
</div>
<div class="task-actions">
<button class="task-action" data-action="edit" aria-label="Edit"><i class="fas fa-pen"></i></button>
<button class="task-action" data-action="delete" aria-label="Delete"><i class="fas fa-trash-alt"></i></button>
</div>
</div>`;
}).join('');
}
function formatDue(iso) {
const today = new Date().toISOString().slice(0, 10);
const tomorrow = addDays(new Date(), 1).toISOString().slice(0, 10);
if (iso === today) return 'Today';
if (iso === tomorrow) return 'Tomorrow';
const d = new Date(iso + 'T12:00:00');
return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
function renderHabits() {
const grid = $('#habit-grid');
if (!grid) return;
const todayIdx = (new Date().getDay() + 6) % 7;
const done = habits.filter(Boolean).length;
grid.innerHTML = DAYS.map((d, i) => {
const cls = ['habit-day', habits[i] ? 'active' : '', i === todayIdx ? 'today' : '', i > todayIdx ? 'future' : ''].join(' ');
return `<div class="${cls}" data-idx="${i}">${d}</div>`;
}).join('');
setText('habit-week-meta', `${done}/7`);
const fill = $('#consistency-fill');
const label = $('#consistency-label');
const pct = Math.round((done / 7) * 100);
if (fill) fill.style.width = pct + '%';
if (label) label.textContent = `${pct}% this week`;
}
function openModal(task = null) {
editingId = task ? task.id : null;
$('#modal-title').textContent = task ? 'Edit Task' : 'New Task';
$('#task-title').value = task ? task.title : '';
$('#task-category').value = task ? task.category : 'work';
$('#task-priority').value = task ? task.priority : 'medium';
$('#task-due').value = task ? task.due || '' : '';
$('#task-modal').classList.add('open');
setTimeout(() => $('#task-title').focus(), 100);
}
function closeModal() {
$('#task-modal').classList.remove('open');
editingId = null;
}
function saveTask(e) {
e.preventDefault();
const title = $('#task-title').value.trim();
if (!title) return;
const data = { title, category: $('#task-category').value, priority: $('#task-priority').value, due: $('#task-due').value || null };
if (editingId) {
const idx = tasks.findIndex((t) => t.id === editingId);
if (idx !== -1) tasks[idx] = { ...tasks[idx], ...data };
} else {
tasks.unshift({ id: uid(), ...data, completed: false, created: Date.now() });
}
persist();
closeModal();
renderAll();
if (currentView === 'tasks') renderTasks();
}
function handleAI(prompt) {
const chat = $('#ai-chat');
if (!chat) return;
appendMessage('user', prompt);
const thinking = document.createElement('div');
thinking.className = 'ai-message system';
thinking.innerHTML = `<div class="ai-avatar"><i class="fas fa-brain"></i></div><div class="ai-bubble"><p>Analyzing…</p></div>`;
chat.appendChild(thinking);
chat.scrollTop = chat.scrollHeight;
setTimeout(() => {
thinking.remove();
appendMessage('system', generateAIResponse(prompt));
}, 600 + Math.random() * 400);
}
function appendMessage(role, text) {
const chat = $('#ai-chat');
const div = document.createElement('div');
div.className = `ai-message ${role === 'user' ? 'user' : 'system'}`;
const icon = role === 'user' ? 'fa-user' : 'fa-brain';
div.innerHTML = `<div class="ai-avatar"><i class="fas ${icon}"></i></div><div class="ai-bubble">${text}</div>`;
chat.appendChild(div);
chat.scrollTop = chat.scrollHeight;
}
function generateAIResponse(prompt) {
const p = prompt.toLowerCase().trim();
const active = tasks.filter((t) => !t.completed);
const done = tasks.filter((t) => t.completed);
const critical = active.filter((t) => t.priority === 'critical');
const high = active.filter((t) => t.priority === 'high');
const todayStr = new Date().toISOString().slice(0, 10);
const dueToday = active.filter((t) => t.due === todayStr);
const rate = tasks.length ? Math.round((done.length / tasks.length) * 100) : 0;
if (/focus|priorit|today|what should/i.test(p)) {
if (critical.length) return `<p><strong>Focus recommendation</strong></p><p>Lead with: <strong>${escapeHtml(critical[0].title)}</strong></p>`;
if (dueToday.length) return `<p>Due today:</p><ul>${dueToday.map((t) => `<li>${escapeHtml(t.title)}</li>`).join('')}</ul>`;
if (active.length) return `<p>Top open items:</p><ul>${active.slice(0, 3).map((t) => `<li>${escapeHtml(t.title)}</li>`).join('')}</ul>`;
return `<p>Your board is clear.</p>`;
}
if (/summar|progress|status/i.test(p)) {
return `<p><strong>Snapshot</strong></p><ul><li>Open: ${active.length}</li><li>Done: ${done.length}</li><li>Hit rate: ${rate}%</li><li>Due today: ${dueToday.length}</li></ul>`;
}
if (/add |create |new task|remind/i.test(p)) {
const match = p.replace(/^(add|create|new task|remind me to|remind)\s+/i, '').trim();
if (match.length > 2) {
const title = match.charAt(0).toUpperCase() + match.slice(1);
tasks.unshift({ id: uid(), title, category: 'work', priority: 'medium', due: null, completed: false, created: Date.now() });
persist();
renderAll();
return `<p>Captured: <strong>${escapeHtml(title)}</strong></p>`;
}
return `<p>Tell me the task title to capture.</p>`;
}
return `<p>I can help with focus, progress, prioritization, or capturing a task.</p>`;
}
function setupEventListeners() {
$$('#task-filters .pill').forEach((pill) => {
pill.addEventListener('click', () => {
$$('#task-filters .pill').forEach((p) => p.classList.remove('active'));
pill.classList.add('active');
currentFilter = pill.dataset.filter;
renderTasks();
});
});
$('#task-list')?.addEventListener('click', (e) => {
const item = e.target.closest('.task-item');
if (!item) return;
const id = item.dataset.id;
const action = e.target.closest('[data-action]')?.dataset.action;
if (action === 'toggle' || e.target.classList.contains('task-check')) {
const t = tasks.find((x) => x.id === id);
if (t) { t.completed = !t.completed; persist(); renderAll(); }
} else if (action === 'edit') {
const t = tasks.find((x) => x.id === id);
if (t) openModal(t);
} else if (action === 'delete') {
if (confirm('Remove this task?')) {
tasks = tasks.filter((x) => x.id !== id);
persist();
renderAll();
}
}
});
$('#priority-list')?.addEventListener('click', (e) => {
if (e.target.closest('.priority-item')) switchView('tasks');
});
$('#habit-grid')?.addEventListener('click', (e) => {
const day = e.target.closest('.habit-day');
if (!day || day.classList.contains('future')) return;
const idx = +day.dataset.idx;
habits[idx] = habits[idx] ? 0 : 1;
persist();
renderHabits();
renderDashboard();
});
$('#add-task-fab')?.addEventListener('click', () => openModal());
$('#modal-close')?.addEventListener('click', closeModal);
$('#modal-cancel')?.addEventListener('click', closeModal);
$('#task-form')?.addEventListener('submit', saveTask);
$('#task-modal')?.addEventListener('click', (e) => {
if (e.target === $('#task-modal')) closeModal();
});
$('#ai-form')?.addEventListener('submit', (e) => {
e.preventDefault();
const input = $('#ai-input');
const val = input.value.trim();
if (!val) return;
input.value = '';
handleAI(val);
});
$$('.suggestion-chip').forEach((chip) => {
chip.addEventListener('click', () => handleAI(chip.dataset.prompt));
});
$('#theme-toggle-btn')?.addEventListener('click', () => {
document.body.classList.toggle('light-mode');
const isLight = document.body.classList.contains('light-mode');
setText('theme-label', isLight ? 'Light' : 'Dark');
const icon = $('#theme-toggle-btn i');
if (icon) icon.className = isLight ? 'fas fa-sun' : 'fas fa-moon';
});
$('#clear-data-btn')?.addEventListener('click', () => {
if (confirm('Reset all demo data and restore sample tasks?')) {
localStorage.removeItem('apex_tasks');
localStorage.removeItem('apex_habits');
localStorage.removeItem('apex_dismissed_notifs');
tasks = [];
habits = [0, 0, 0, 0, 0, 0, 0];
dismissedNotifs = [];
seedSampleData();
renderAll();
}
});
}
function setText(id, val) {
const el = document.getElementById(id);
if (el) el.textContent = val;
}
function escapeHtml(str) {
const div = document.createElement('div');
div.textContent = str;
return div.innerHTML;
}
const WELLBEING_SLOTS = [
{h:7,m:30,msg:'Good morning. Set one clear priority for the day and protect focus time.'},
{h:9,m:30,msg:'Late morning check-in: stay with deep work. Short stretch if you have been seated.'},
{h:12,m:0,msg:'Midday pause. Eat, hydrate, and step away from screens for a few minutes.'},
{h:14,m:30,msg:'Afternoon focus. Close one open loop before starting something new.'},
{h:16,m:30,msg:'Late afternoon: review progress and plan a clean handoff for tomorrow.'},
{h:18,m:0,msg:'Evening wind-down. Capture remaining tasks and switch out of work mode.'},
{h:20,m:0,msg:'End of day close. Acknowledge what you finished. Rest supports tomorrow\'s performance.'}
];
let lastWellbeingKey = localStorage.getItem('apex_wellbeing_key') || '';
let wellbeingEnabled = localStorage.getItem('apex_wellbeing_on') !== '0';
function wellbeingKey(slot) {
const d = new Date();
return d.toISOString().slice(0,10) + '-' + slot.h + ':' + slot.m;
}
function speakWellbeing(text) {
try {
if (!('speechSynthesis' in window)) return;
const u = new SpeechSynthesisUtterance(text);
u.rate = 0.95; u.pitch = 1; u.volume = 0.9;
window.speechSynthesis.cancel();
window.speechSynthesis.speak(u);
} catch (e) {}
}
async function notifyWellbeing(text) {
try {
if (!('Notification' in window)) return;
if (Notification.permission === 'default') await Notification.requestPermission();
if (Notification.permission === 'granted') {
new Notification('Apex Wellbeing', { body: text, tag: 'apex-wellbeing' });
}
} catch (e) {}
}
function checkWellbeing() {
if (!wellbeingEnabled) return;
const now = new Date();
const mins = now.getHours() * 60 + now.getMinutes();
for (const slot of WELLBEING_SLOTS) {
const slotMins = slot.h * 60 + slot.m;
if (mins >= slotMins && mins < slotMins + 5) {
const key = wellbeingKey(slot);
if (key === lastWellbeingKey) return;
lastWellbeingKey = key;
localStorage.setItem('apex_wellbeing_key', key);
notifyWellbeing(slot.msg);
speakWellbeing(slot.msg);
const insight = document.getElementById('ai-insight-text');
if (insight) insight.textContent = 'Wellbeing: ' + slot.msg;
return;
}
}
}
function setupWellbeing() {
checkWellbeing();
setInterval(checkWellbeing, 60 * 1000);
if ('Notification' in window && Notification.permission === 'default') {
Notification.requestPermission().catch(() => {});
}
}
document.addEventListener('DOMContentLoaded', init);
})();
