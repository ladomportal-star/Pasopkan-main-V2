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
    let localVal: string | null = null;
    if (this.isLocalStorageAvailable()) {
      try {
        localVal = window.localStorage.getItem(key);
      } catch (e) {
        console.warn('Storage read failed. Using memory fallback.', e);
      }
    }
    if (localVal !== null && localVal !== undefined) {
      this.memoryStorage[key] = localVal;
      return localVal;
    }
    return this.memoryStorage[key] !== undefined ? this.memoryStorage[key] : null;
  }

  setItem(key: string, value: string): void {
    const strVal = String(value);
    this.memoryStorage[key] = strVal;

    if (this.isLocalStorageAvailable()) {
      try {
        window.localStorage.setItem(key, strVal);
      } catch (e) {
        console.warn('Storage write failed. Attempting quota cleanup...', e);
        try {
          // If quota exceeded, clean up temporary keys to make room for critical data like organizer_events
          if (key !== 'eventDraft') {
            window.localStorage.removeItem('eventDraft');
          }
          window.localStorage.removeItem('__storage_test__');
          window.localStorage.setItem(key, strVal);
        } catch (retryErr) {
          console.warn('Quota recovery write failed. Retained in memory.', retryErr);
        }
      }
    }

    // Broadcast update across the application
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('pasopkan_storage_update', { detail: { key, value: strVal } }));
        window.dispatchEvent(new Event('storage'));
      } catch (_) {}
    }
  }

  removeItem(key: string): void {
    delete this.memoryStorage[key];
    if (this.isLocalStorageAvailable()) {
      try {
        window.localStorage.removeItem(key);
      } catch (e) {
        console.warn('Storage deletion failed. Using memory fallback.', e);
      }
    }

    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('pasopkan_storage_update', { detail: { key, value: null } }));
        window.dispatchEvent(new Event('storage'));
      } catch (_) {}
    }
  }

  clear(): void {
    this.memoryStorage = {};
    if (this.isLocalStorageAvailable()) {
      try {
        window.localStorage.clear();
      } catch (e) {
        console.warn('Storage clear failed. Using memory fallback.', e);
      }
    }
  }
}

export const safeStorage = new SafeStorage();

