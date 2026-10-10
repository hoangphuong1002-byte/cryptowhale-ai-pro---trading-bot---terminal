// Offline Storage & File Backup Service
// Solves: "có thể tạo file phần mềm trên đt , lưu trữ các thông tin, hoạt động offline"

import { BotSettings, ExecutedTrade, KlineData, MarketPair, TradeSignal } from '../types';

export interface AppOfflineBackupData {
  version: string;
  exportedAt: number;
  appName: string;
  settings: BotSettings;
  trades: ExecutedTrade[];
  portfolioBalance: number;
  viewMode: 'QB_SIMPLE' | 'PRO_TERMINAL';
  layoutPrefs?: any;
  copilotChatHistory?: any[];
  cachedPairs?: MarketPair[];
  cachedSignals?: TradeSignal[];
  deviceInfo?: string;
}

export const offlineStorage = {
  // 1. Export entire app state into a downloadable file on phone/PC
  exportAppDataToFile(data: {
    settings: BotSettings;
    trades: ExecutedTrade[];
    portfolioBalance: number;
    viewMode: 'QB_SIMPLE' | 'PRO_TERMINAL';
    layoutPrefs?: any;
    copilotChatHistory?: any[];
    cachedPairs?: MarketPair[];
  }) {
    const backup: AppOfflineBackupData = {
      version: '2.5.0',
      exportedAt: Date.now(),
      appName: 'CryptoWhale AI Pro - Mobile Offline Data',
      settings: data.settings,
      trades: data.trades,
      portfolioBalance: data.portfolioBalance,
      viewMode: data.viewMode,
      layoutPrefs: data.layoutPrefs,
      copilotChatHistory: data.copilotChatHistory || [],
      cachedPairs: data.cachedPairs,
      deviceInfo: typeof navigator !== 'undefined' ? navigator.userAgent : 'Mobile',
    };

    const jsonString = JSON.stringify(backup, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `CryptoWhale_AppFile_${dateStr}.cwpro`;

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return {
      success: true,
      filename,
      sizeBytes: blob.size,
      sizeKb: (blob.size / 1024).toFixed(1),
    };
  },

  // 2. Import file from phone/PC and restore app state
  async importAppDataFromFile(file: File): Promise<AppOfflineBackupData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const parsed = JSON.parse(content) as AppOfflineBackupData;

          if (!parsed || !parsed.settings || !Array.isArray(parsed.trades)) {
            throw new Error('Định dạng file sao lưu không hợp lệ.');
          }

          resolve(parsed);
        } catch (err: any) {
          reject(new Error(err?.message || 'Không thể đọc file'));
        }
      };
      reader.onerror = () => reject(new Error('Lỗi khi đọc file trên thiết bị'));
      reader.readAsText(file);
    });
  },

  // 3. Save Copilot Chat History to Phone Local Storage
  saveCopilotHistory(messages: any[]) {
    try {
      localStorage.setItem('cw_copilot_history', JSON.stringify(messages.slice(-30)));
    } catch (e) {
      console.warn('Failed saving copilot history', e);
    }
  },

  getCopilotHistory(): any[] {
    try {
      const raw = localStorage.getItem('cw_copilot_history');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Fall through
    }
    return [];
  },

  // 4. Calculate local storage stats on phone
  getLocalStorageUsage() {
    let totalBytes = 0;
    try {
      for (const key in localStorage) {
        if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
          totalBytes += (localStorage[key].length + key.length) * 2;
        }
      }
    } catch {
      // Fall through
    }
    return {
      usedKb: (totalBytes / 1024).toFixed(1),
      formatted: `${(totalBytes / 1024).toFixed(1)} KB`,
    };
  },
};
