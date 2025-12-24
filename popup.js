// HTML要素の取得
const timerDisplay = document.getElementById('timer');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const workInput = document.getElementById('workTime');
const breakInput = document.getElementById('breakTime');
const categorySelect = document.getElementById('workCategory');
const categoryArea = document.getElementById('category-area');
const statusText = document.getElementById('statusText');
const historyList = document.getElementById('historyList');
const downloadBtn = document.getElementById('downloadBtn');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

// 初期化処理
updateDisplay();
renderHistory();
setInterval(updateDisplay, 1000);

startBtn.addEventListener('click', () => {
  chrome.storage.local.get(['isRunning', 'mode'], (res) => {
    const nextMode = (res.mode === 'break') ? 'work' : (res.mode === 'work' ? 'break' : 'work');
    startTimer(nextMode);
  });
});

resetBtn.addEventListener('click', () => {
  chrome.alarms.clearAll();
  chrome.storage.local.set({ isRunning: false, targetTime: null, mode: 'work', currentCategory: null });
  updateDisplay();
});

// CSVダウンロードボタン
downloadBtn.addEventListener('click', () => {
  chrome.storage.local.get(['workHistory'], (res) => {
    const history = res.workHistory || [];
    if (history.length === 0) return alert('履歴がありません');

    // CSVデータ作成 (BOM付き)
    let csvContent = "\uFEFF日時,カテゴリ,種類,時間(分)\n";
    history.forEach(item => {
      const cat = item.category || '-';
      csvContent += `${item.date},${cat},${item.type},${item.duration}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "focus_history.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
});

// 履歴クリアボタン
clearHistoryBtn.addEventListener('click', () => {
  if(confirm('履歴を全て削除しますか？')) {
    chrome.storage.local.set({ workHistory: [] }, () => {
      renderHistory();
    });
  }
});

function startTimer(mode) {
  const durationMinutes = mode === 'work' ? parseInt(workInput.value) : parseInt(breakInput.value);
  const targetTime = Date.now() + durationMinutes * 60 * 1000;
  
  // 作業時は選択内容、休憩時は固定文字列
  const category = mode === 'work' ? categorySelect.value : '休憩';

  chrome.storage.local.set({
    isRunning: true,
    targetTime: targetTime,
    mode: mode,
    currentDuration: durationMinutes,
    currentCategory: category
  });

  chrome.alarms.create('timerAlarm', { when: targetTime });
  updateDisplay();
}

function updateDisplay() {
  chrome.storage.local.get(['isRunning', 'targetTime', 'mode'], (res) => {
    
    if (res.isRunning && res.targetTime) {
      const remaining = res.targetTime - Date.now();
      
      if (remaining > 0) {
        // カウントダウン中
        const m = Math.floor(remaining / 60000);
        const s = Math.floor((remaining % 60000) / 1000);
        timerDisplay.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        
        categoryArea.style.display = 'none';

        if (res.mode === 'work') {
            statusText.textContent = "🔥 作業中";
            statusText.style.color = "#2196F3";
            startBtn.style.display = 'none';
        } else {
            statusText.textContent = "☕ 休憩中";
            statusText.style.color = "#4CAF50";
            startBtn.style.display = 'none';
        }
      } else {
        // 終了時
        timerDisplay.textContent = "00:00";
        statusText.textContent = "終了！";
        startBtn.style.display = 'block';
        
        renderHistory();

        if (res.mode === 'work') {
            startBtn.textContent = "休憩スタート";
            startBtn.style.backgroundColor = "#4CAF50";
            categoryArea.style.display = 'none';
        } else {
            startBtn.textContent = "作業スタート";
            startBtn.style.backgroundColor = "#2196F3";
            categoryArea.style.display = 'block';
        }
      }
    } else {
      // 待機中
      timerDisplay.textContent = "00:00";
      statusText.textContent = "待機中";
      startBtn.style.display = 'block';
      startBtn.textContent = "作業スタート";
      startBtn.style.backgroundColor = "#2196F3";
      categoryArea.style.display = 'block';
    }
  });
}

function renderHistory() {
  chrome.storage.local.get(['workHistory'], (res) => {
    const history = res.workHistory || [];
    historyList.innerHTML = '';

    if (history.length === 0) {
      historyList.innerHTML = '<li class="no-history">履歴はまだありません</li>';
      return;
    }

    history.slice().reverse().forEach(item => {
      const li = document.createElement('li');
      const categoryLabel = item.category ? `<span class="history-category">${item.category}</span>` : '';
      const color = item.type === 'work' ? '#2196F3' : '#4CAF50';
      
      li.innerHTML = `
        <div><span>${item.date}</span></div>
        <div style="text-align:right;">
            ${categoryLabel}
            <span style="color:${color}; font-weight:bold;">${item.duration}分</span>
        </div>
      `;
      historyList.appendChild(li);
    });
  });
}
