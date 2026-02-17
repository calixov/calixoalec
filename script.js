// --- INITIAL DATA STRUCTURE ---
const defaultState = {
    lvl: 1,
    currentDate: new Date().toLocaleDateString(),
    quests: [], // تسک‌های فعال امروز
    history: {} // آرشیو روزهای گذشته
};

// بارگذاری اطلاعات یا ساخت دیتای اولیه
let data = JSON.parse(localStorage.getItem('solo_system_v4')) || defaultState;

// پیام‌های سیستم
const messages = [
    "System Initialized.",
    "Do not fail today.",
    "Your past defines your future.",
    "Complete all tasks to Level Up.",
    "Laziness is a sin in this world."
];

// --- CORE LOGIC: CHECK NEW DAY ---
function checkNewDay() {
    const today = new Date().toLocaleDateString();
    
    // اگر تاریخ ذخیره شده با امروز فرق دارد (یعنی وارد روز جدید شدیم)
    if (data.currentDate !== today) {
        // 1. ذخیره عملکرد دیروز در تاریخچه
        // فقط تسک‌های دیروز را آرشیو می‌کنیم
        if (data.quests.length > 0) {
            data.history[data.currentDate] = {
                tasks: JSON.parse(JSON.stringify(data.quests)), // کپی عمیق تسک‌ها
                xpEarned: calculateDailyXP(data.quests)
            };
        }

        // 2. ریست کردن برای روز جدید
        // تسک‌ها باقی می‌مانند، اما تیک انجام‌شده (completed) همگی برداشته می‌شود
        data.quests.forEach(q => q.completed = false);
        
        // 3. بروزرسانی تاریخ
        data.currentDate = today;
        save();
        showMsg("NEW DAY. SYSTEM RESET. FIGHT!");
    }
}

// محاسبه درصد XP بر اساس تعداد تسک‌ها
function calculateDailyXP(questList) {
    if (questList.length === 0) return 0;
    const completedCount = questList.filter(q => q.completed).length;
    // فرمول: (تسک‌های انجام شده / کل تسک‌ها) * 100
    return Math.floor((completedCount / questList.length) * 100);
}

function save() {
    localStorage.setItem('solo_system_v4', JSON.stringify(data));
    render();
}

// --- QUEST MAKER FUNCTIONS ---
function addQuest() {
    const input = document.getElementById('new-quest-input');
    if (!input.value.trim()) return;

    data.quests.push({
        id: Date.now(),
        text: input.value,
        completed: false
    });
    input.value = "";
    save();
    showMsg("NEW OBJECTIVE ASSIGNED.");
}

function deleteQuest(id) {
    data.quests = data.quests.filter(q => q.id !== id);
    save();
}

function editQuest(id) {
    const quest = data.quests.find(q => q.id === id);
    const newText = prompt("REWRITE SYSTEM COMMAND:", quest.text);
    if (newText) {
        quest.text = newText;
        save();
    }
}

// --- PLAY & XP LOGIC ---
function toggleComplete(id) {
    const quest = data.quests.find(q => q.id === id);
    quest.completed = !quest.completed;
    
    // چک کردن لول آپ
    const percentage = calculateDailyXP(data.quests);
    if (percentage === 100) {
        showMsg("ALL TASKS COMPLETE. LEVEL UP PENDING...");
        // اینجا می‌توانیم منطق افزایش لول عددی را هم اضافه کنیم اگر بخواهی
        // فعلاً فقط XP روزانه پر می‌شود
    }
    
    save();
}

// --- UI RENDERING ---
function switchTab(tabName) {
    // مخفی کردن همه صفحات
    document.getElementById('view-setup').classList.add('hidden');
    document.getElementById('view-play').classList.add('hidden');
    document.getElementById('view-calendar').classList.add('hidden');
    document.getElementById('view-rank').classList.add('hidden'); // این خط جدید اضافه شد
    
    // غیرفعال کردن دکمه‌ها
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));

    // نمایش تب انتخاب شده
    document.getElementById('view-' + tabName).classList.remove('hidden');
    
    // اگر دکمه‌ای وجود داشت فعالش کن (چون ممکنه دکمه جدید هنوز تو HTML نباشه ارور نده)
    const btn = document.getElementById('btn-' + tabName);
    if(btn) btn.classList.add('active');

    // رندر کردن محتوای خاص هر تب
    if(tabName === 'calendar') renderCalendar();
    if(tabName === 'rank') renderRankPage(); // این خط جدید اضافه شد
}

function showMsg(text) {
    const box = document.getElementById('msg-box');
    box.innerText = `[SYSTEM]: ${text}`;
}

function render() {
    // 1. Update Status Bar
    // محاسبه XP لحظه‌ای امروز
    const currentXP = calculateDailyXP(data.quests);
    document.getElementById('xp-txt').innerText = `${currentXP}% COMPLETE`;
    document.getElementById('xp-bar').style.width = `${currentXP}%`;
    document.getElementById('date-display').innerText = `TODAY: ${data.currentDate}`;

    // اگر XP صد در صد شد، لول را بالا ببر (نمایشی یا واقعی)
    // نکته: لول آپ واقعی را گذاشتیم برای پایان روز یا وقتی 100 شد
    if (currentXP === 100 && data.quests.length > 0) {
        document.getElementById('xp-bar').style.background = "#00ff00"; // سبز شدن نوار
        document.getElementById('xp-bar').style.boxShadow = "0 0 15px #00ff00";
    } else {
        document.getElementById('xp-bar').style.background = ""; // برگشت به آبی
        document.getElementById('xp-bar').style.boxShadow = "";
    }

    // 2. Render Quest Maker List
    const setupList = document.getElementById('setup-list');
    setupList.innerHTML = data.quests.map(q => `
        <div class="quest-item">
            <span>${q.text}</span>
            <div class="edit-controls">
                <button class="edit" onclick="editQuest(${q.id})">EDIT</button>
                <button class="del" onclick="deleteQuest(${q.id})">DEL</button>
            </div>
        </div>
    `).join('');

    // 3. Render Play List
    const playList = document.getElementById('play-list');
    if (data.quests.length === 0) {
        playList.innerHTML = "<div style='text-align:center; padding-top:20px; color:#555'>NO QUESTS FOUND.<br>GO TO 'QUEST MAKER'.</div>";
    } else {
        playList.innerHTML = data.quests.map(q => `
            <div class="quest-item" onclick="toggleComplete(${q.id})" style="cursor:pointer">
                <div style="display:flex; align-items:center;">
                    <div class="checkbox-area ${q.completed ? 'checked' : ''}"></div>
                    <span class="${q.completed ? 'quest-done' : ''}">${q.text}</span>
                </div>
            </div>
        `).join('');
    }
}

// --- CALENDAR LOGIC ---
function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    grid.innerHTML = "";
    
    // دریافت لیست تاریخ‌های موجود در هیستوری
    // (به علاوه امروز برای نمایش وضعیت فعلی)
    const dates = Object.keys(data.history).reverse(); // از جدید به قدیم
    
    if (dates.length === 0) {
        grid.innerHTML = "<div style='grid-column: span 3; text-align:center; color:#555;'>NO HISTORY YET.</div>";
        return;
    }

    dates.forEach(date => {
        const dayData = data.history[date];
        const xp = dayData.xpEarned;
        
        let colorClass = "";
        if (xp === 100) colorClass = "perfect-day";
        
        grid.innerHTML += `
            <div class="day-card ${colorClass}" onclick="showHistoryDetails('${date}')">
                <div class="date">${date}</div>
                <div class="xp-indicator">${xp}%</div>
            </div>
        `;
    });
}

function showHistoryDetails(dateKey) {
    const detailsBox = document.getElementById('history-details');
    const list = document.getElementById('hist-list');
    const title = document.getElementById('hist-date');
    
    const dayData = data.history[dateKey];
    
    title.innerText = `LOG: ${dateKey}`;
    list.innerHTML = dayData.tasks.map(t => `
        <li>
            <span>${t.text}</span>
            <span style="color: ${t.completed ? '#00d2ff' : '#555'}">
                ${t.completed ? '[DONE]' : '[FAIL]'}
            </span>
        </li>
    `).join('');
    
    detailsBox.classList.remove('hidden');
}

function closeHistory() {
    document.getElementById('history-details').classList.add('hidden');
}

// STARTUP
checkNewDay();
// --- RANK SYSTEM LOGIC ---

const RANKS = [
    { id: 'E', min: 0,    color: 'white',  title: 'Novice' },
    { id: 'D', min: 700,  color: 'green',  title: 'Fighter' }, // 7 روز تلاش بی نقص
    { id: 'C', min: 1400, color: 'blue',   title: 'Elite' },   // 14 روز
    { id: 'B', min: 2100, color: 'purple', title: 'Knight' },  // 21 روز
    { id: 'A', min: 2800, color: 'red',    title: 'General' }, // 28 روز
    { id: 'S', min: 3500, color: 'gold',   title: 'Monarch' }  // 35 روز
];

function calculateTotalXP() {
    let total = 0;
    
    // 1. جمع زدن XP روزهای گذشته از تاریخچه
    Object.values(data.history).forEach(day => {
        total += day.xpEarned || 0;
    });

    // 2. اضافه کردن XP همین امروز
    total += calculateDailyXP(data.quests);

    return total;
}

function renderRankPage() {
    const totalXP = calculateTotalXP();
    const container = document.getElementById('rank-grid');
    const currentRankDisplay = document.getElementById('current-rank-display');
    const totalXpDisplay = document.getElementById('total-xp-display');

    container.innerHTML = '';
    totalXpDisplay.innerText = totalXP;

    let highestRank = 'E'; // رنک پیش‌فرض

    RANKS.forEach(rank => {
        // آیا بازیکن به امتیاز این رنک رسیده؟
        const isUnlocked = totalXP >= rank.min;
        
        if (isUnlocked) highestRank = rank.id;

        container.innerHTML += `
            <div class="rank-card rank-${rank.id} ${isUnlocked ? 'unlocked' : ''}">
                <div class="rank-letter">${rank.id}</div>
                <div style="font-weight:bold;">${rank.title}</div>
                <div class="rank-xp-req">REQ: ${rank.min} XP</div>
                ${!isUnlocked ? '<div style="margin-top:5px; font-size:1.2rem;">🔒</div>' : ''}
            </div>
        `;
    });

    // بروزرسانی تیتر بالای صفحه با رنگ مخصوص
    const currentRankObj = RANKS.find(r => r.id === highestRank);
    currentRankDisplay.innerText = `RANK: ${highestRank}`;
    currentRankDisplay.style.color = currentRankObj.id === 'S' ? '#ffd700' : 
                                     currentRankObj.id === 'A' ? '#ff3e3e' : 
                                     currentRankObj.id === 'B' ? '#bc13fe' : 
                                     currentRankObj.id === 'C' ? '#00d2ff' : 
                                     currentRankObj.id === 'D' ? '#00ff00' : 'white';
}