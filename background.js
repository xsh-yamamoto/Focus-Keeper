chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'timerAlarm') {
    
    // 現在の状態を取得
    chrome.storage.local.get(['mode', 'currentDuration', 'workHistory', 'currentCategory'], (res) => {
      let title = "";
      let message = "";
      
      const now = new Date();
      // 日時フォーマット作成
      const dateStr = `${now.getFullYear()}/${now.getMonth()+1}/${now.getDate()} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
      
      const newEntry = {
        date: dateStr,
        type: res.mode,
        duration: res.currentDuration || 0,
        category: res.currentCategory || '-'
      };

      const history = res.workHistory || [];
      history.push(newEntry);
      
      // 履歴保存後に通知を表示
      chrome.storage.local.set({ workHistory: history }, () => {
        
        if (res.mode === 'work') {
          title = "お疲れ様です！";
          message = `${res.currentCategory} (${res.currentDuration}分) が終了しました。記録しました。`;
        } else {
          title = "休憩終了";
          message = "リフレッシュ完了！作業に戻りましょう。";
        }

        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icon.png',
          title: title,
          message: message,
          priority: 2
        });
      });
    });
  }
});
