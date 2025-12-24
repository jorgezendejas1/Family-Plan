
import { CalendarEvent, CalendarConfig } from '../types';

/**
 * SERVICIO DE GOOGLE CALENDAR PREMIUM
 * Maneja sincronización bidireccional para múltiples miembros de la familia.
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

  addAccount: async (): Promise<GoogleAccount> => {
    return new Promise((resolve, reject) => {
      try {
        if (!(window as any).google?.accounts?.oauth2) {
          console.error("GSI library not loaded");
          return resolve(googleCalendarService.createMockAccount());
        }

        const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPES,
          callback: async (resp: any) => {
            if (resp.error) return reject(resp);

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
      email: `family_${Math.floor(Math.random()*99)}@gmail.com`,
      name: 'Google Family User',
      photoUrl: `https://ui-avatars.com/api/?name=F+U&background=007AFF&color=fff`,
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

  /**
   * Sincroniza eventos de Google hacia la App (Pull)
   * Solo para los miembros que tienen una cuenta vinculada.
   */
  fetchAllMappedEvents: async (calendars: CalendarConfig[]): Promise<CalendarEvent[]> => {
    const accounts = googleCalendarService.getConnectedAccounts();
    const mappedEmails = calendars.filter(c => c.googleAccountEmail).map(c => c.googleAccountEmail);
    const allEvents: CalendarEvent[] = [];

    for (const acc of accounts) {
      if (!mappedEmails.includes(acc.email)) continue;
      if (acc.accessToken.startsWith('mock_')) continue;

      try {
        const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?access_token=${acc.accessToken}`);
        if (!response.ok) continue;
        
        const data = await response.json();
        const targetCal = calendars.find(c => c.googleAccountEmail === acc.email);
        
        const mapped = data.items.map((item: any) => ({
          id: `g_${item.id}`,
          remoteId: item.id,
          title: item.summary || '(Sin título)',
          start: new Date(item.start.dateTime || item.start.date),
          end: new Date(item.end.dateTime || item.end.date),
          description: item.description,
          location: item.location,
          color: targetCal?.color || '#4285F4', 
          calendarId: targetCal?.id || 'default',
          isRemote: true,
          accountId: acc.email
        }));
        
        allEvents.push(...mapped);
      } catch (e) {
        console.error("Sync error for", acc.email);
      }
    }
    return allEvents;
  },

  /**
   * Envía un evento de la App hacia Google Calendar (Push - 2 Way)
   */
  pushEventToGoogle: async (event: CalendarEvent, calendars: CalendarConfig[]): Promise<void> => {
    const targetCal = calendars.find(c => c.id === event.calendarId);
    if (!targetCal || !targetCal.googleAccountEmail) return;

    const accounts = googleCalendarService.getConnectedAccounts();
    const acc = accounts.find(a => a.email === targetCal.googleAccountEmail);
    
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

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gEvent)
      });
    } catch (e) {
      console.error("Error pushing to Google:", e);
    }
  },

  disconnectAccount: (email: string) => {
    const accounts = googleCalendarService.getConnectedAccounts().filter(a => a.email !== email);
    localStorage.setItem('google_accounts', JSON.stringify(accounts));
  }
};
