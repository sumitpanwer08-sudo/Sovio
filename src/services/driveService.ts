// Google Drive integration service for Pahadi Memories

let accessToken: string | null = localStorage.getItem('sovio_drive_token') || localStorage.getItem('panwar_drive_token');

export function getStoredToken(): string | null {
  return accessToken;
}

export function setStoredToken(token: string) {
  accessToken = token;
  if (token) {
    localStorage.setItem('sovio_drive_token', token);
  } else {
    localStorage.removeItem('sovio_drive_token');
    localStorage.removeItem('panwar_drive_token');
  }
}

export function requestDriveAccess(onSuccess: (token: string) => void, onError?: (err: any) => void) {
  if (typeof window === 'undefined' || !(window as any).google?.accounts?.oauth2) {
    alert('Google Identity Services library is loading. Please try again in a moment.');
    return;
  }

  try {
    // Standard OAuth token request via GIS client
    const client = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: '157709939487-applet.apps.googleusercontent.com', // standard client or public studio client
      scope: 'https://www.googleapis.com/auth/drive.file',
      callback: (response: any) => {
        if (response.error) {
          console.error('Google Drive Auth Error:', response.error?.message || String(response.error));
          if (onError) onError(response.error);
          return;
        }
        if (response.access_token) {
          setStoredToken(response.access_token);
          onSuccess(response.access_token);
        }
      }
    });

    client.requestAccessToken({ prompt: 'consent' });
  } catch (err: any) {
    console.error('Failed to initialize Google Drive token client:', err?.message || String(err));
    if (onError) onError(err);
  }
}

export async function saveMemoryToDrive(
  token: string,
  memory: { title: string; content: string; location?: string; tags?: string[] }
) {
  // Ensure we only serialize safe primitive fields, avoiding any synthetic DOM events or circular refs
  const safePayload = {
    title: typeof memory.title === 'string' ? memory.title : String(memory.title || ''),
    content: typeof memory.content === 'string' ? memory.content : String(memory.content || ''),
    location: typeof memory.location === 'string' ? memory.location : 'Sovio Mountain Radio',
    tags: Array.isArray(memory.tags)
      ? memory.tags.map((t) => (typeof t === 'string' ? t : String(t))).filter(Boolean)
      : []
  };

  const res = await fetch('/api/drive/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(safePayload)
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to save memory to Google Drive');
  }

  return await res.json();
}

export async function fetchMemoriesFromDrive(token: string) {
  const res = await fetch('/api/drive/memories', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to load memories from Google Drive');
  }

  const data = await res.json();
  return data.memories || [];
}
