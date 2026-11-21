import {handleLocalApi} from './demoStore';

type BackendMode = 'unknown' | 'server' | 'static';

let backendMode: BackendMode = 'unknown';
let fallbackInstalled = false;

const nativeFetch: typeof window.fetch =
  typeof window !== 'undefined' ? window.fetch.bind(window) : fetch;

function isJsonResponse(res: Response): boolean {
  const ct = res.headers.get('content-type') || '';
  return ct.toLowerCase().includes('application/json');
}

export async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  if (backendMode === 'static') {
    return handleLocalApi(input, init);
  }

  try {
    const res = await nativeFetch(input, init);
    const json = isJsonResponse(res);

    // If static host returns HTML (SPA fallback) or 404/405/5xx without JSON API payload,
    // switch seamlessly to browser-local static demo mode.
    if (!json || res.status === 404 || res.status === 405 || res.status >= 500) {
      if (backendMode === 'unknown' || !json || res.status === 405 || res.status >= 500) {
        backendMode = 'static';
        return handleLocalApi(input, init);
      }
    }

    backendMode = 'server';
    return res;
  } catch {
    backendMode = 'static';
    return handleLocalApi(input, init);
  }
}

export function installStaticApiFallback(): void {
  if (typeof window === 'undefined' || fallbackInstalled) return;
  fallbackInstalled = true;

  const wrappedFetch: typeof window.fetch = (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    const urlStr =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

    let isSameOriginApi = urlStr.startsWith('/api/');
    if (!isSameOriginApi) {
      try {
        const parsed = new URL(urlStr, window.location.origin);
        isSameOriginApi =
          parsed.origin === window.location.origin &&
          parsed.pathname.startsWith('/api/');
      } catch {
        isSameOriginApi = false;
      }
    }

    if (isSameOriginApi) {
      return apiFetch(urlStr, init);
    }

    return nativeFetch(input, init);
  };

  try {
    const ownDesc = Object.getOwnPropertyDescriptor(window, 'fetch');
    if (!ownDesc || ownDesc.configurable) {
      Object.defineProperty(window, 'fetch', {
        value: wrappedFetch,
        writable: true,
        configurable: true,
      });
    } else if (ownDesc.writable) {
      window.fetch = wrappedFetch;
    }
  } catch {
    // Ignore if environment locks down window.fetch completely
  }
}
