'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface PyodideRunResult {
  success: boolean;
  error?: string;
}

const PYODIDE_INDEX_URL = 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/';

export function usePyodide(enabled: boolean = true) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pyodideRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        if (!enabled) {
          setIsLoading(false);
          return;
        }
        setIsLoading(true);
        const pyodideModule = await import('pyodide');
        const pyodide = await pyodideModule.loadPyodide({
          indexURL: PYODIDE_INDEX_URL
        });

        if (!isMounted) {
          return;
        }

        pyodideRef.current = pyodide;
        setIsLoading(false);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }
        setError('Failed to load Python runtime.');
        setIsLoading(false);
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [enabled]);

  const runCode = useCallback(async (code: string): Promise<PyodideRunResult> => {
    const pyodide = pyodideRef.current;
    if (!pyodide) {
      return { success: false, error: 'Python runtime not ready.' };
    }

    let timeoutId: number | null = null;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = window.setTimeout(() => {
        reject(new Error('Execution timed out.'));
      }, 8000);
    });

    try {
      await Promise.race([pyodide.runPythonAsync(code), timeoutPromise]);
      return { success: true };
    } catch (executionError: any) {
      return {
        success: false,
        error: executionError?.message ?? 'Execution failed.'
      };
    } finally {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    }
  }, []);

  return { runCode, isLoading, error };
}
