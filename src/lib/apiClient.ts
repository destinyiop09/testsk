import {handleLocalApi} from './demoStore';

type BackendMode = 'unknown' | 'server' | 'static';

let backendMode: BackendMode = 'unknown';

function isJsonResponse(res: Response): boolean {
  const ct = res.headers.get('content-type') || '';
  return ct.toLowerCase().includes('application/json');
}

export async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  if (backendMode === 'static') {
    return handleLocalApi(input, init);
  }

  try {
    const res = await fetch(input, init);
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
