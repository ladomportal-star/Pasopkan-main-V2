class SafeStorage {
  private memoryStorage: Record<string, string> = {};

  private isLocalStorageAvailable(): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }
      const testKey = '__storage_test__';
      window.localStorage.setItem(testKey, testKey);
      window.localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }

  getItem(key: string): string | null {
    if (this.isLocalStorageAvailable()) {
      try {
        return window.localStorage.getItem(key);
      } catch (e) {
        console.warn('Storage read failed. Using memory fallback.', e);
      }
    }
    return this.memoryStorage[key] !== undefined ? this.memoryStorage[key] : null;
  }

  setItem(key: string, value: string): void {
    if (this.isLocalStorageAvailable()) {
      try {
        window.localStorage.setItem(key, value);
        return;
      } catch (e) {
        console.warn('Storage write failed. Using memory fallback.', e);
      }
    }
    this.memoryStorage[key] = String(value);
  }

  removeItem(key: string): void {
    if (this.isLocalStorageAvailable()) {
      try {
        window.localStorage.removeItem(key);
        return;
      } catch (e) {
        console.warn('Storage deletion failed. Using memory fallback.', e);
      }
    }
    delete this.memoryStorage[key];
  }

  clear(): void {
    if (this.isLocalStorageAvailable()) {
      try {
        window.localStorage.clear();
        return;
      } catch (e) {
        console.warn('Storage clear failed. Using memory fallback.', e);
      }
    }
    this.memoryStorage = {};
  }
}

export const safeStorage = new SafeStorage();
