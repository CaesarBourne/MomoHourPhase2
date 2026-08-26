'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

const STORAGE_KEY = 'momo-hour-portal:gha-base-url';
const DEFAULT_BASE_URL = process.env.NEXT_PUBLIC_GHA_BASE_URL || 'http://localhost:3000';

interface BaseUrlContextValue {
  baseUrl: string;
  setBaseUrl: (url: string) => void;
  resetToDefault: () => void;
  defaultBaseUrl: string;
}

const BaseUrlContext = createContext<BaseUrlContextValue | null>(null);

function normalize(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

export function BaseUrlProvider({ children }: { children: ReactNode }) {
  const [baseUrl, setBaseUrlState] = useState(DEFAULT_BASE_URL);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setBaseUrlState(stored);
    }
  }, []);

  const setBaseUrl = (url: string) => {
    const clean = normalize(url);
    setBaseUrlState(clean);
    window.localStorage.setItem(STORAGE_KEY, clean);
  };

  const resetToDefault = () => {
    setBaseUrlState(DEFAULT_BASE_URL);
    window.localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <BaseUrlContext.Provider
      value={{ baseUrl, setBaseUrl, resetToDefault, defaultBaseUrl: DEFAULT_BASE_URL }}
    >
      {children}
    </BaseUrlContext.Provider>
  );
}

export function useBaseUrl(): BaseUrlContextValue {
  const ctx = useContext(BaseUrlContext);
  if (!ctx) {
    throw new Error('useBaseUrl must be used within a BaseUrlProvider');
  }
  return ctx;
}
