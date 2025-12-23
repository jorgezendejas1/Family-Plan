
import { CalendarEvent } from '../types';

/**
 * SERVICIO DE GOOGLE CALENDAR PREMIUM
 * Este servicio maneja múltiples flujos de OAuth y sincronización en segundo plano.
 */

const CLIENT_ID = process.env.VITE_GOOGLE_CLIENT_ID || '';
const SCOPES = 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly';

export interface GoogleAccount {
  email: string;
  name: string;
  photoUrl?: string;
  accessToken: string;
  expiresAt: number;
  lastSync?: string;
  status: 'active' | 'expired' | 'syncing';
}

export const googleCalendarService = {
  
  getConnectedAccounts: (): GoogleAccount[] => {
    const data = localStorage.getItem('google_accounts');
    return data ? JSON.parse(data) : [];
  },

  /**
   * Inicia el flujo de Google Identity Services para agregar una cuenta adicional.
   */
  addAccount: async (): Promise<GoogleAccount> => {
    return new Promise((resolve, reject) => {
      try {
        if (!(window as any).google?.accounts?.oauth2) {
          console.error("GSI library not loaded");
          // Fallback para desarrollo si no hay API cargada
          return resolve(googleCalendarService.createMockAccount());
        }

        const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPES,
          callback: async (resp: any) => {
            if (resp.error) return reject(resp);

            // Obtener info del perfil
            const userInfoResp = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${resp.access_token}` }
            });
            const userInfo = await userInfoResp.json();

            const newAccount: GoogleAccount = {
              email: userInfo.email,
              name: userInfo.name,
              photoUrl: userInfo.picture,
              accessToken: resp.access_token,
              expiresAt: Date.now() + (resp.expires_in * 1000),
              lastSync: new Date().toISOString(),
              status: 'active'
            };

            const accounts = googleCalendarService.getConnectedAccounts();
            const idx = accounts.findIndex(a => a.email === newAccount.email);
            if (idx >= 0) accounts[idx] = newAccount;
            else accounts.push(newAccount);

            localStorage.setItem('google_accounts', JSON.stringify(accounts));
            resolve(newAccount);
          },
        });
        tokenClient.requestAccessToken({ prompt: 'select_account' });
      } catch (e) {
        resolve(googleCalendarService.createMockAccount());
      }
    });
  },

  createMockAccount: (): GoogleAccount => {
    const mock: GoogleAccount = {
      email: `premium_${Math.floor(Math.random()*99)}@gmail.com`,
      name: 'Google User',
      photoUrl: `https://ui-avatars.com/api/?name=Premium+User&background=007AFF&color=fff`,
      accessToken: 'mock_' + Date.now(),
      expiresAt: Date.now() + 3600000,
      lastSync: new Date().toISOString(),
      status: 'active'
    };
    const accounts = googleCalendarService.getConnectedAccounts();
    accounts.push(mock);
    localStorage.setItem('google_accounts', JSON.stringify(accounts));
    return mock;
  },

  fetchAllRemoteEvents: async (): Promise<CalendarEvent[]> => {
    const accounts = googleCalendarService.getConnectedAccounts();
    const allEvents: CalendarEvent[] = [];

    for (const acc of accounts) {
      if (acc.accessToken.startsWith('mock_')) continue;

      try {
        // Marcamos como sincronizando en la UI
        acc.status = 'syncing';
        
        const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?access_token=${acc.accessToken}`);
        
        if (response.status === 401) {
          acc.status = 'expired';
          continue;
        }

        if (!response.ok) continue;
        
        const data = await response.json();
        const mapped = data.items.map((item: any) => ({
          id: `g_${item.id}`,
          remoteId: item.id,
          title: item.summary || '(Sin título)',
          start: new Date(item.start.dateTime || item.start.date),
          end: new Date(item.end.dateTime || item.end.date),
          description: item.description,
          location: item.location,
          color: '#4285F4', 
          calendarId: `google_${acc.email}`,
          isRemote: true,
          accountId: acc.email
        }));
        
        allEvents.push(...mapped);
        acc.status = 'active';
        acc.lastSync = new Date().toISOString();
      } catch (e) {
        acc.status = 'expired';
      }
    }
    localStorage.setItem('google_accounts', JSON.stringify(accounts));
    return allEvents;
  },

  // Fix: Added missing pushEvent method to synchronize local events to Google Calendar
  /**
   * Pushes a local event to Google Calendar API.
   * If the event has a remoteId, it performs an update (PUT).
   * Otherwise, it creates a new event (POST).
   */
  pushEvent: async (event: CalendarEvent): Promise<void> => {
    const accounts = googleCalendarService.getConnectedAccounts();
    // Extract email from calendarId (format: google_email@example.com)
    const email = event.calendarId.replace('google_', '');
    const acc = accounts.find(a => a.email === email);
    
    if (!acc || acc.accessToken.startsWith('mock_')) return;

    try {
      const gEvent = {
        summary: event.title,
        description: event.description,
        location: event.location,
        start: { dateTime: event.start.toISOString() },
        end: { dateTime: event.end.toISOString() },
      };

      const url = event.remoteId 
        ? `https://www.googleapis.com/calendar/v3/calendars/primary/events/${event.remoteId}?access_token=${acc.accessToken}`
        : `https://www.googleapis.com/calendar/v3/calendars/primary/events?access_token=${acc.accessToken}`;
      
      const method = event.remoteId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gEvent)
      });

      if (!response.ok) {
        console.error("Failed to push event to Google Calendar", await response.text());
      }
    } catch (e) {
      console.error("Error pushing event to Google Calendar:", e);
    }
  },

  disconnectAccount: (email: string) => {
    const accounts = googleCalendarService.getConnectedAccounts().filter(a => a.email !== email);
    localStorage.setItem('google_accounts', JSON.stringify(accounts));
  }
};
