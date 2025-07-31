import { useCallback, useRef } from 'react';

/**
 * Sistema de Cache Inteligente
 * Implementa cache com TTL (Time To Live) e invalidação automática
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live em milliseconds
  key: string;
}

interface CacheConfig {
  defaultTTL?: number;
  maxSize?: number;
  prefix?: string;
}

class IntelligentCache {
  private config: Required<CacheConfig>;
  private memoryCache: Map<string, CacheItem<any>>;

  constructor(config: CacheConfig = {}) {
    this.config = {
      defaultTTL: config.defaultTTL || 5 * 60 * 1000, // 5 minutos default
      maxSize: config.maxSize || 100, // máximo 100 itens na memória
      prefix: config.prefix || 'calendar_cache_'
    };
    this.memoryCache = new Map();
    
    // Limpeza automática a cada minuto
    setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Armazena dados no cache (memória + localStorage)
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const timeToLive = ttl || this.config.defaultTTL;
    const prefixedKey = this.config.prefix + key;

    const cacheItem: CacheItem<T> = {
      data,
      timestamp: now,
      ttl: timeToLive,
      key: prefixedKey
    };

    // Cache em memória (mais rápido)
    this.memoryCache.set(prefixedKey, cacheItem);

    // Cache no localStorage (persistente)
    try {
      localStorage.setItem(prefixedKey, JSON.stringify(cacheItem));
    } catch (error) {
      console.warn('Erro ao salvar no localStorage:', error);
    }

    // Limitar tamanho do cache em memória
    if (this.memoryCache.size > this.config.maxSize) {
      const oldestKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(oldestKey);
    }
  }

  /**
   * Recupera dados do cache
   */
  get<T>(key: string): T | null {
    const prefixedKey = this.config.prefix + key;
    const now = Date.now();

    // Tentar cache em memória primeiro
    let cacheItem = this.memoryCache.get(prefixedKey);

    // Se não estiver em memória, tentar localStorage
    if (!cacheItem) {
      try {
        const stored = localStorage.getItem(prefixedKey);
        if (stored) {
          cacheItem = JSON.parse(stored) as CacheItem<T>;
          // Restaurar para memória
          this.memoryCache.set(prefixedKey, cacheItem);
        }
      } catch (error) {
        console.warn('Erro ao ler do localStorage:', error);
        return null;
      }
    }

    // Verificar se ainda é válido
    if (cacheItem && (now - cacheItem.timestamp) < cacheItem.ttl) {
      return cacheItem.data;
    }

    // Cache expirado, remover
    if (cacheItem) {
      this.delete(key);
    }

    return null;
  }

  /**
   * Remove item do cache
   */
  delete(key: string): void {
    const prefixedKey = this.config.prefix + key;
    this.memoryCache.delete(prefixedKey);
    localStorage.removeItem(prefixedKey);
  }

  /**
   * Limpa cache expirado
   */
  cleanup(): void {
    const now = Date.now();

    // Limpar memória
    const entries = Array.from(this.memoryCache.entries());
    for (const [key, item] of entries) {
      if ((now - item.timestamp) >= item.ttl) {
        this.memoryCache.delete(key);
      }
    }

    // Limpar localStorage
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.config.prefix)) {
        try {
          const item = JSON.parse(localStorage.getItem(key) || '');
          if ((now - item.timestamp) >= item.ttl) {
            keysToRemove.push(key);
          }
        } catch (error) {
          // Item corrompido, remover
          keysToRemove.push(key);
        }
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    // Limpar memória
    this.memoryCache.clear();

    // Limpar localStorage
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.config.prefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  /**
   * Invalida cache baseado em padrão
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);

    // Limpar memória
    const keys = Array.from(this.memoryCache.keys());
    for (const key of keys) {
      if (regex.test(key)) {
        this.memoryCache.delete(key);
      }
    }

    // Limpar localStorage
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.config.prefix) && regex.test(key)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  /**
   * Obtém estatísticas do cache
   */
  getStats() {
    const memorySize = this.memoryCache.size;
    let localStorageSize = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.config.prefix)) {
        localStorageSize++;
      }
    }

    return {
      memorySize,
      localStorageSize,
      maxSize: this.config.maxSize,
      defaultTTL: this.config.defaultTTL
    };
  }
}

// Hook React para usar o cache
export const useIntelligentCache = (config?: CacheConfig) => {
  const cacheRef = useRef<IntelligentCache | null>(null);

  if (!cacheRef.current) {
    cacheRef.current = new IntelligentCache(config);
  }

  const cache = cacheRef.current;

  const getCached = useCallback(<T>(key: string): T | null => {
    return cache.get<T>(key);
  }, [cache]);

  const setCached = useCallback(<T>(key: string, data: T, ttl?: number): void => {
    cache.set(key, data, ttl);
  }, [cache]);

  const deleteCached = useCallback((key: string): void => {
    cache.delete(key);
  }, [cache]);

  const invalidatePattern = useCallback((pattern: string): void => {
    cache.invalidatePattern(pattern);
  }, [cache]);

  const clearCache = useCallback((): void => {
    cache.clear();
  }, [cache]);

  const getCacheStats = useCallback(() => {
    return cache.getStats();
  }, [cache]);

  return {
    getCached,
    setCached,
    deleteCached,
    invalidatePattern,
    clearCache,
    getCacheStats
  };
};

// TTLs específicos para diferentes tipos de dados
export const CacheTTL = {
  DASHBOARD_DATA: 5 * 60 * 1000,     // 5 minutos
  NOTIFICATIONS: 1 * 60 * 1000,      // 1 minuto
  USER_DATA: 15 * 60 * 1000,         // 15 minutos
  CHURCHES_DATA: 10 * 60 * 1000,     // 10 minutos
  EVENTS_DATA: 3 * 60 * 1000,        // 3 minutos
  MEMBERS_DATA: 10 * 60 * 1000,      // 10 minutos
  REPORTS_DATA: 1 * 60 * 1000        // 1 minuto
} as const;

// Instância global do cache
export const globalCache = new IntelligentCache({
  defaultTTL: 5 * 60 * 1000, // 5 minutos
  maxSize: 200,
  prefix: 'calendar_app_'
});

export default IntelligentCache;