// --- INITIAL DATA STRUCTURE ---
const defaultState = {
    totalXp: 0, 
    gold: 0, 
    currentDate: new Date().toLocaleDateString(),
    quests: [], 
    history: {},
    lastPenalty: 0,
    inPenaltyZone: false, 
    currentPunishment: "" 
};

// تغییر دیتابیس به v10 برای اعمال ساختار جدید تسک‌ها (XP جدا، Gold جدا)
let data = JSON.parse(localStorage.getItem('solo_system_v10')) || defaultState;
let chartInstance = null; 

if (data.gold === undefined) data.gold = 0;

const ranks = [
    { id: 'E', name: 'TRAINEE', minLvl: 1, color: 'rank-e', desc: "Even the weakest can become strong." },
    { id: 'D', name: 'NOVICE', minLvl: 3, color: 'rank-d', desc: "Keep training your body and mind." },
    { id: 'C', name: 'FIGHTER', minLvl: 7, color: 'rank-c', desc: "Stability is the key to power." },
    { id: 'B', name: 'ELITE', minLvl: 15, color: 'rank-b', desc: "You are leaving humanity behind." },
    { id: 'A', name: 'MASTER', minLvl: 30, color: 'rank-a', desc: "Few have reached this height." },
    { id: 'S', name: 'MONARCH', minLvl: 50, color: 'rank-s', desc: "You are the Shadow Monarch." }
];

const punishmentList = [
    "1",
    "2",
    "3",
    "3",
    "4"
];

const shopItems = [
    { id: 1, name: "Eat a Snack", price: 15 },
    { id: 2, name: "Read 1 Manhwa Chapter", price: 20 },
    { id: 3, name: "Go Out (Free Walk)", price: 25 },
    { id: 4, name: "Energy Drink", price: 30 },
    { id: 5, name: "Watch TV Series (1 Ep)", price: 40 },
    { id: 6, name: "Cheat Meal: Sweet Treat", price: 50 },
    { id: 7, name: "Buy Stationery", price: 50 },
    { id: 8, name: "Sleep In (No Alarm)", price: 80 },
    { id: 9, name: "Cheat Meal: Fast Food", price: 100 },
    { id: 10, name: "Buy a Houseplant", price: 150 },
    { id: 11, name: "Dine at a New Restaurant", price: 200 },
    { id: 12, name: "Buy New Clothes", price: 300 },
    { id: 13, name: "Skip Hard Task (1 Week)", price: 400 },
    { id: 14, name: "Do Nothing Day", price: 500 },
    { id: 15, name: "Free Weekend (No Plans)", price: 600 },
    { id: 16, name: "Premium Pro Course", price: 1000 }
];

const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;

function playSystemSound() {
    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.type = 'square'; 
    osc.frequency.setValueAtTime(600, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
}

function getLevelInfo() {
    let earnedToday = data.quests.filter(q => q.completed).reduce((sum, q) => sum + q.xp, 0);
    let absoluteTotal = data.totalXp + earnedToday;
    
    let currentLvl = Math.floor(absoluteTotal / 100) + 1;
    let currentXpInLvl = absoluteTotal % 100;
    
    return { lvl: currentLvl, xp: currentXpInLvl, todayTotal: earnedToday };
}

function checkNewDay() {
    const today = new Date().toLocaleDateString();
    
    if (data.currentDate !== today) {
        let earnedToday = 0;
        let penaltyToday = 0;
        let failedQuestsCount = 0;

        data.quests.forEach(q => {
            if(q.completed) {
                earnedToday += q.xp;
            } else {
                penaltyToday += Math.floor(q.xp / 2); 
                failedQuestsCount++;
            }
        });
        
        if (data.quests.length > 0) {
            data.history[data.currentDate] = {
                tasks: JSON.parse(JSON.stringify(data.quests)),
                xpEarned: earnedToday,
                penalty: penaltyToday
            };
            
            data.totalXp += earnedToday;
            data.totalXp -= penaltyToday;
            if(data.totalXp < 0) data.totalXp = 0; 
            
            if (failedQuestsCount > 0) {
                data.inPenaltyZone = true;
                data.currentPunishment = punishmentList[Math.floor(Math.random() * punishmentList.length)];
            }
        }

        data.lastPenalty = penaltyToday; 
        data.quests.forEach(q => q.completed = false);
        data.currentDate = today;
        save();
    }
}

function save() {
    localStorage.setItem('solo_system_v10', JSON.stringify(data));
    render();
}

function survivePenalty() {
    data.inPenaltyZone = false;
    data.currentPunishment = "";
    showMsg("PENALTY CLEARED. WELCOME BACK.");
    save();
    switchTab('play'); 
}

function addQuest() {
    const textInput = document.getElementById('new-quest-input');
    const xpInput = document.getElementById('new-quest-xp');
    const goldInput = document.getElementById('new-quest-gold'); // دریافت فیلد طلا
    
    const text = textInput.value.trim();
    const xpVal = parseInt(xpInput.value) || 10; 
    // اگر فیلد طلا خالی بود، به صورت پیش‌فرض صفر در نظر می‌گیرد (تسک پولی نمی‌دهد)
    const goldVal = parseInt(goldInput.value) || 0; 

    if (!text) return;
    
    // حالا هر تسک مقدار طلای مخصوص خودش را دارد
    data.quests.push({ id: Date.now(), text: text, xp: xpVal, goldReward: goldVal, completed: false });
    
    textInput.value = "";
    xpInput.value = "";
    goldInput.value = "";
    save();
}

function deleteQuest(id) {
    data.quests = data.quests.filter(q => q.id !== id);
    save();
}

function toggleComplete(id) {
    const quest = data.quests.find(q => q.id === id);
    quest.completed = !quest.completed;
    
    if(quest.completed) {
        data.gold += quest.goldReward; // گرفتن طلای اختصاصی همین تسک
        playSystemSound();
        showMsg(`[XP: +${quest.xp} | GOLD: +${quest.goldReward}]`);
    } else {
        data.gold -= quest.goldReward; // کسر طلای اختصاصی همین تسک
        showMsg(`[XP & GOLD REVERTED]`);
    }
    
    save();
}

function buyItem(id) {
    const item = shopItems.find(i => i.id === id);
    if (data.gold >= item.price) {
        data.gold -= item.price;
        playSystemSound();
        showMsg(`[PURCHASE SUCCESS: ${item.name} | -${item.price} G]`);
        save();
        if(document.getElementById('view-shop').classList.contains('hidden') === false){
            renderShop(); 
        }
    } else {
        showMsg(`[INSUFFICIENT GOLD. REQUIRES ${item.price} G]`);
    }
}

function renderShop() {
    const grid = document.getElementById('shop-list');
    const goldDisplay = document.getElementById('shop-gold-display');
    
    if(!grid) return; 
    
    goldDisplay.innerText = `BALANCE: ${data.gold} G`;
    
    grid.innerHTML = shopItems.map(item => `
        <div class="quest-item" style="display:flex; justify-content: space-between; align-items: center; opacity: ${data.gold >= item.price ? '1' : '0.5'};">
            <div>
                <span class="quest-xp-tag" style="border-color:var(--neon-gold); color:var(--neon-gold); font-weight:bold;">${item.price} G</span>
                <span style="margin-left: 10px;">${item.name}</span>
            </div>
            <button class="add-btn" style="padding: 5px 15px; font-size: 0.8rem; background: ${data.gold >= item.price ? 'var(--neon-gold)' : '#555'}; color: black;" onclick="buyItem(${item.id})">BUY</button>
        </div>
    `).join('');
}

function exportData() {
    const dataStr = JSON.stringify(data);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `solo_leveling_save_${new Date().toISOString().split('T')[0]}.json`; 
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showMsg("SAVE FILE CREATED SUCCESSFULLY.");
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            if (importedData.totalXp !== undefined && Array.isArray(importedData.quests)) {
                data = importedData;
                save(); 
                showMsg("SYSTEM DATA RESTORED.");
                switchTab('play');
            } else {
                showMsg("ERROR: INVALID SAVE FILE.");
            }
        } catch (err) {
            showMsg("ERROR: CORRUPTED FILE.");
        }
    };
    reader.readAsText(file);
    event.target.value = ""; 
}

function switchTab(tabName) {
    document.querySelectorAll('.content-area').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById('view-' + tabName).classList.remove('hidden');
    document.getElementById('btn-' + tabName).classList.add('active');

    if(tabName === 'calendar') renderCalendar();
    if(tabName === 'ranks') renderRanks();
    if(tabName === 'stats') renderStats(); 
    if(tabName === 'shop') renderShop(); 
}

function showMsg(text) {
    document.getElementById('msg-box').innerText = `${text}`;
}

function render() {
    const penaltyOverlay = document.getElementById('penalty-overlay');
    const mainNav = document.getElementById('main-nav');
    
    if (data.inPenaltyZone) {
        mainNav.style.display = 'none';
        document.querySelectorAll('.content-area').forEach(el => el.classList.add('hidden'));
        
        penaltyOverlay.classList.remove('hidden');
        penaltyOverlay.style.display = 'flex';
        document.getElementById('punishment-text').innerText = data.currentPunishment;
        return; 
    } else {
        mainNav.style.display = 'flex';
        penaltyOverlay.classList.add('hidden');
        penaltyOverlay.style.display = 'none';
        
        if (!document.querySelector('.tab-btn.active')) {
            document.getElementById('view-play').classList.remove('hidden');
            document.getElementById('btn-play').classList.add('active');
        }
    }

    const info = getLevelInfo();
    document.getElementById('level-txt').innerText = `LV. ${info.lvl}`;
    document.getElementById('xp-numbers').innerText = `${info.xp} / 100 XP`;
    document.getElementById('xp-bar').style.width = `${info.xp}%`;
    document.getElementById('date-display').innerText = `TODAY: ${data.currentDate}`;
    
    const currentRank = ranks.slice().reverse().find(r => info.lvl >= r.minLvl) || ranks[0];
    const badge = document.getElementById('rank-badge');
    badge.className = `rank-badge ${currentRank.color}`;
    badge.innerText = `RANK ${currentRank.id}`;
    
    const goldTop = document.getElementById('gold-top');
    if(goldTop) goldTop.innerText = `${data.gold} G`;

    const playList = document.getElementById('play-list');
    if (data.quests.length === 0) {
        playList.innerHTML = "<div style='text-align:center; color:#555; margin-top:20px'>NO QUESTS.</div>";
    } else {
        playList.innerHTML = data.quests.map(q => `
            <div class="quest-item" onclick="toggleComplete(${q.id})" style="cursor:pointer">
                <div style="display:flex; align-items:center;">
                    <div class="checkbox-area ${q.completed ? 'checked' : ''}"></div>
                    <span class="${q.completed ? 'quest-done' : ''}">${q.text}</span>
                    <span class="quest-xp-tag">+${q.xp} XP | +${q.goldReward} G</span>
                </div>
            </div>
        `).join('');
    }

    document.getElementById('setup-list').innerHTML = data.quests.map(q => `
        <div class="quest-item">
            <div>
                <span>${q.text}</span>
                <span class="quest-xp-tag" style="border-color:#555; color:#888">${q.xp} XP | ${q.goldReward} G</span>
            </div>
            <button onclick="deleteQuest(${q.id})" style="background:none; border:1px solid #333; color:red; padding:5px; cursor:pointer">DEL</button>
        </div>
    `).join('');
}

function renderRanks() {
    const info = getLevelInfo();
    const grid = document.getElementById('rank-list');
    
    grid.innerHTML = ranks.map(r => {
        const isUnlocked = info.lvl >= r.minLvl;
        return `
            <div class="rank-card ${r.color} ${isUnlocked ? 'unlocked' : ''}">
                <div class="rank-info">
                    <h2 style="color:${isUnlocked ? 'inherit' : '#333'}">RANK ${r.id}</h2>
                    <p>${isUnlocked ? r.desc : 'LOCKED - REACH LV. ' + r.minLvl}</p>
                </div>
                <div class="rank-icon">${r.id}</div>
            </div>
        `;
    }).join('');
}

function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    const dates = Object.keys(data.history).reverse();
    
    if (dates.length === 0) {
        grid.innerHTML = "<div style='color:#555; text-align:center; grid-column:span 3'>NO DATA YET</div>";
        return;
    }

    grid.innerHTML = dates.map(date => {
        const dayData = data.history[date];
        return `
            <div class="day-card" title="Penalty: -${dayData.penalty || 0}">
                <div class="date" style="font-size:0.75rem; color:#888">${date}</div>
                <div class="xp-indicator" style="color:var(--neon-blue)">+${dayData.xpEarned}</div>
                ${dayData.penalty > 0 ? `<div style="color:var(--neon-red); font-size:0.7rem;">-${dayData.penalty}</div>` : ''}
            </div>
        `;
    }).join('');
}

function renderStats() {
    const penaltyZone = document.getElementById('penalty-zone-msg');
    if (data.lastPenalty > 0) {
        penaltyZone.innerHTML = `
            <div class="penalty-box" style="display:block; border: 1px solid var(--neon-red); padding:10px; background: rgba(255, 62, 62, 0.05);">
                <h3 style="color: var(--neon-red); margin:0;">⚠️ SYSTEM PENALTY ⚠️</h3>
                <p style="color:#ccc; font-size:0.8rem;">You failed to complete tasks yesterday.</p>
                <p style="font-size: 1.2rem; font-weight:bold; color:var(--neon-red); margin:5px 0 0 0;">-${data.lastPenalty} XP DEDUCTED</p>
            </div>
        `;
    } else {
        penaltyZone.innerHTML = `<div style="color:#555; margin-top:20px;">No penalties applied. Good job.</div>`;
    }

    const historyKeys = Object.keys(data.history).slice(-7); 
    let labels = [];
    let xpData = [];

    if (historyKeys.length === 0) {
        labels = ['No Data'];
        xpData = [0];
    } else {
        labels = historyKeys.map(date => date.slice(0, 5)); 
        xpData = historyKeys.map(date => data.history[date].xpEarned);
    }

    const info = getLevelInfo();
    labels.push('Today');
    xpData.push(info.todayTotal);

    const ctx = document.getElementById('xpChart').getContext('2d');
    
    if (chartInstance) {
        chartInstance.destroy();
    }

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'XP EARNED',
                data: xpData,
                borderColor: '#00d2ff', 
                backgroundColor: 'rgba(0, 210, 255, 0.1)',
                borderWidth: 2,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#00d2ff',
                pointRadius: 4,
                fill: true,
                tension: 0.3 
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true, grid: { color: '#333' }, ticks: { color: '#888' } },
                x: { grid: { color: '#222' }, ticks: { color: '#888' } }
            },
            plugins: {
                legend: { labels: { color: '#fff', font: { family: 'Courier New' } } }
            }
        }
    });
}

// START
checkNewDay();
render();