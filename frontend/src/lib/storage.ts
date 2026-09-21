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

  /**
   * Attempt quota recovery by trimming disposable items and oversized caching keys
   */
  private recoverQuota(targetKey: string, targetValue: string): boolean {
    if (typeof window === 'undefined' || !window.localStorage) return false;

    // 1. First priority disposable / transient keys to purge
    const disposableKeys = [
      '__storage_test__',
      'eventDraft',
      'pasopkan_notif_last_refresh',
      'pasopkan_local_inquiries'
    ];

    for (const dKey of disposableKeys) {
      if (dKey !== targetKey) {
        try {
          window.localStorage.removeItem(dKey);
        } catch (_) {}
      }
    }

    // Try writing after clearing disposable keys
    try {
      window.localStorage.setItem(targetKey, targetValue);
      return true;
    } catch (_) {}

    // 2. Clear non-essential large assets if quota is still exceeded
    // Oversized base64 profile pictures or temporary staff caches can exceed 2-4MB
    const largeCacheKeys = [
      'pasopkan_user_profile_pic',
      'pasopkan_staff_links',
      'pasopkan_user_notifications'
    ];

    for (const lKey of largeCacheKeys) {
      if (lKey !== targetKey) {
        try {
          window.localStorage.removeItem(lKey);
        } catch (_) {}
      }
    }

    try {
      window.localStorage.setItem(targetKey, targetValue);
      return true;
    } catch (_) {}

    // 3. Compact attendees or tickets if quota is still exceeded
    // If saving another key or if pasopkan_event_attendees itself is large
    if (targetKey !== 'pasopkan_event_attendees') {
      try {
        const existingAtt = window.localStorage.getItem('pasopkan_event_attendees');
        if (existingAtt) {
          const parsed = JSON.parse(existingAtt);
          if (Array.isArray(parsed) && parsed.length > 50) {
            const trimmed = parsed.slice(-50);
            window.localStorage.setItem('pasopkan_event_attendees', JSON.stringify(trimmed));
          }
        }
      } catch (_) {}

      try {
        window.localStorage.setItem(targetKey, targetValue);
        return true;
      } catch (_) {}
    } else {
      // targetKey IS pasopkan_event_attendees
      try {
        const parsed = JSON.parse(targetValue);
        if (Array.isArray(parsed) && parsed.length > 40) {
          // Keep newest 40 attendees to guarantee fit within mobile browser storage quotas
          const trimmed = parsed.slice(-40);
          const trimmedStr = JSON.stringify(trimmed);
          window.localStorage.setItem(targetKey, trimmedStr);
          this.memoryStorage[targetKey] = trimmedStr;
          return true;
        }
      } catch (_) {}
    }

    return false;
  }

  setItem(key: string, value: string): void {
    const strVal = String(value);
    this.memoryStorage[key] = strVal;

    if (this.isLocalStorageAvailable()) {
      try {
        window.localStorage.setItem(key, strVal);
      } catch (e) {
        console.warn(`Storage write failed for key "${key}". Attempting quota recovery...`, e);
        const recovered = this.recoverQuota(key, strVal);
        if (!recovered) {
          console.warn(`Quota recovery write could not persist "${key}" to localStorage. Retained safely in memory storage.`);
        }
      }
    }

    // Broadcast update across the application asynchronously so it never interrupts a React render cycle
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        try {
          window.dispatchEvent(new CustomEvent('pasopkan_storage_update', { detail: { key, value: strVal } }));
          window.dispatchEvent(new Event('storage'));
        } catch (_) {}
      }, 0);
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
      setTimeout(() => {
        try {
          window.dispatchEvent(new CustomEvent('pasopkan_storage_update', { detail: { key, value: null } }));
          window.dispatchEvent(new Event('storage'));
        } catch (_) {}
      }, 0);
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

