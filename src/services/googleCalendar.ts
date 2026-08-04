const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';
const SCOPE = 'https://www.googleapis.com/auth/calendar.events';
const TOKEN_KEY = 'lexcontrol_gcal_token';

// Agenda compartida del despacho: todos los eventos que crea LexControl
// (fecha limite y audiencia) se guardan aqui, no en el calendario personal
// de quien sincroniza, para que todo el equipo vea la misma agenda.
const CALENDAR_ID =
  (import.meta.env.VITE_GOOGLE_CALENDAR_ID as string | undefined) ||
  'ed6cc7cbe28f99d7c2fdc873236d4c38b400b79915479c3da92241dc6a8b6c58@group.calendar.google.com';

interface StoredToken {
  access_token: string;
  expires_at: number;
}

interface GoogleTokenResponse {
  access_token: string;
  expires_in: string | number;
}

interface GoogleErrorResponse {
  message?: string;
  type?: string;
}

interface GoogleIdentityServices {
  accounts: {
    oauth2: {
      initTokenClient: (config: {
        client_id: string;
        scope: string;
        callback: (response: GoogleTokenResponse) => void;
        error_callback?: (error: GoogleErrorResponse) => void;
      }) => {
        requestAccessToken: (options?: { prompt?: string }) => void;
      };
    };
  };
}

declare global {
  interface Window {
    google?: GoogleIdentityServices;
  }
}

let gisPromise: Promise<void> | null = null;

function loadGisScript(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (gisPromise) return gisPromise;

  gisPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      gisPromise = null;
      reject(new Error('No se pudo cargar Google Identity Services.'));
    };
    document.head.appendChild(script);
  });

  return gisPromise;
}

function saveToken(accessToken: string, expiresIn: number): void {
  const token: StoredToken = {
    access_token: accessToken,
    expires_at: Date.now() + expiresIn * 1000,
  };
  localStorage.setItem(TOKEN_KEY, JSON.stringify(token));
}

function getStoredToken(): StoredToken | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    const token = JSON.parse(raw) as StoredToken;
    if (Date.now() >= token.expires_at - 60_000) return null;
    return token;
  } catch {
    return null;
  }
}

export function isGoogleCalendarConnected(): boolean {
  return !!getStoredToken();
}

export function disconnectGoogleCalendar(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function getAccessToken(): Promise<string> {
  const existing = getStoredToken();
  if (existing) return existing.access_token;

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
  if (!clientId) {
    throw new Error(
      'Falta configurar VITE_GOOGLE_CLIENT_ID en Vercel para poder conectar con Google Calendar.'
    );
  }

  await loadGisScript();

  return new Promise<string>((resolve, reject) => {
    const tokenClient = window.google!.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPE,
      callback: (response) => {
        if (!response.access_token) {
          reject(new Error('No se recibió autorización de Google.'));
          return;
        }
        saveToken(response.access_token, Number(response.expires_in) || 3600);
        resolve(response.access_token);
      },
      error_callback: (err) => {
        reject(new Error(err?.message || 'Error durante la autorización con Google.'));
      },
    });
    tokenClient.requestAccessToken({ prompt: '' });
  });
}

export interface CalendarSyncResult {
  success: boolean;
  eventUrl?: string;
  error?: string;
}

function addOneDay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

export async function syncFechaLimiteToCalendar(params: {
  numero: string;
  materia: string;
  juzgado: string;
  actor: string;
  demandado: string;
  proximoARealizar: string;
  fechaLimite: string;
}): Promise<CalendarSyncResult> {
  try {
    const accessToken = await getAccessToken();

    const eventPayload = {
      summary: `Vencimiento: ${params.numero} — ${params.actor} vs ${params.demandado}`,
      description: [
        `Expediente: ${params.numero}`,
        `Materia: ${params.materia}`,
        `Juzgado: ${params.juzgado}`,
        `Actor: ${params.actor}`,
        `Demandado: ${params.demandado}`,
        '',
        `Próxima acción: ${params.proximoARealizar || 'N/A'}`,
      ].join('\n'),
      start: { date: params.fechaLimite },
      end: { date: addOneDay(params.fechaLimite) },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 24 * 60 },
          { method: 'popup', minutes: 60 },
        ],
      },
    };

    const response = await fetch(`${CALENDAR_API_BASE}/calendars/${encodeURIComponent(CALENDAR_ID)}/events`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventPayload),
    });

    if (!response.ok) {
      if (response.status === 401) disconnectGoogleCalendar();
      const errBody = await response.json().catch(() => null);
      return {
        success: false,
        error: errBody?.error?.message || `Error HTTP ${response.status}`,
      };
    }

    const data = await response.json();
    return { success: true, eventUrl: data.htmlLink };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error desconocido al crear el evento.',
    };
  }
}

export async function syncAudienciaToCalendar(params: {
  numero: string;
  materia: string;
  juzgado: string;
  actor: string;
  demandado: string;
  audienciaFecha: string;
  audienciaHora: string;
}): Promise<CalendarSyncResult> {
  try {
    const accessToken = await getAccessToken();

    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Mexico_City';
    const inicio = new Date(`${params.audienciaFecha}T${params.audienciaHora}:00`);
    const fin = new Date(inicio.getTime() + 60 * 60 * 1000);

    const eventPayload = {
      summary: `Audiencia: ${params.numero} — ${params.actor} vs ${params.demandado}`,
      description: [
        `Expediente: ${params.numero}`,
        `Materia: ${params.materia}`,
        `Juzgado: ${params.juzgado}`,
        `Actor: ${params.actor}`,
        `Demandado: ${params.demandado}`,
      ].join('\n'),
      start: { dateTime: inicio.toISOString(), timeZone },
      end: { dateTime: fin.toISOString(), timeZone },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 24 * 60 },
          { method: 'popup', minutes: 60 },
        ],
      },
    };

    const response = await fetch(`${CALENDAR_API_BASE}/calendars/${encodeURIComponent(CALENDAR_ID)}/events`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventPayload),
    });

    if (!response.ok) {
      if (response.status === 401) disconnectGoogleCalendar();
      const errBody = await response.json().catch(() => null);
      return {
        success: false,
        error: errBody?.error?.message || `Error HTTP ${response.status}`,
      };
    }

    const data = await response.json();
    return { success: true, eventUrl: data.htmlLink };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error desconocido al crear el evento.',
    };
  }
}
