
import { CalendarEvent, CalendarConfig } from '../types';
import { MOCK_GOOGLE_EVENTS, CALENDAR_IDS } from '../constants';

/**
 * Service to handle Google Calendar API Integration.
 * 
 * NOTE: For a real implementation, you need:
 * 1. A Google Cloud Project with Calendar API enabled.
 * 2. OAuth 2.0 Client IDs configured for your domain.
 * 3. The 'gapi' script loaded in index.html (https://apis.google.com/js/api.js)
 * 4. The 'google.accounts.oauth2' script loaded.
 */

const CLIENT_ID = 'YOUR_REAL_CLIENT_ID_HERE';
const API_KEY = 'YOUR_REAL_API_KEY_HERE';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';

export const googleCalendarService = {
  
  isAuthenticated: false,

  /**
   * Initializes the Google API client.
   * In a real app, this would load gapi.client and oauth2.
   */
  init: async () => {
    // console.log('Initializing Google API...');
    // await gapi.client.init({ apiKey: API_KEY, discoveryDocs: [DISCOVERY_DOC] });
    return true;
  },

  /**
   * Triggers the OAuth 2.0 sign-in flow.
   * Returns a mock user profile for the demo.
   */
  signIn: async (): Promise<{ name: string; email: string; photoUrl?: string }> => {
    return new Promise((resolve) => {
        // SIMULATION: Delay to mimic popup interaction
        setTimeout(() => {
            googleCalendarService.isAuthenticated = true;
            resolve({
                name: 'Usuario Google',
                email: 'usuario@gmail.com',
                photoUrl: 'https://lh3.googleusercontent.com/a/default-user=s96-c'
            });
        }, 1500);
    });

    /* REAL IMPLEMENTATION:
    return new Promise((resolve, reject) => {
        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            callback: (resp) => {
                if (resp.error) reject(resp);
                resolve(getUserProfile());
            },
        });
        tokenClient.requestAccessToken();
    });
    */
  },

  /**
   * Signs out the user.
   */
  signOut: async () => {
    googleCalendarService.isAuthenticated = false;
    return Promise.resolve();
  },

  /**
   * Fetches calendars from the user's account.
   */
  listCalendars: async (): Promise<CalendarConfig[]> => {
      // SIMULATION
      return [{
          id: CALENDAR_IDS.GOOGLE,
          label: 'Google Principal',
          color: '#4285F4', // Google Blue
          visible: true,
          isRemote: true
      }];
  },

  /**
   * Fetches events from the specific calendar.
   */
  listEvents: async (calendarId: string): Promise<CalendarEvent[]> => {
      // SIMULATION
      // In a real app, we would fetch from:
      // gapi.client.calendar.events.list({ 'calendarId': 'primary', timeMin: ... })
      
      // We return mock events but ensure dates are relative to "today" to make them visible
      return MOCK_GOOGLE_EVENTS.map(ev => ({
          ...ev,
          // Ensure mock events are around the current date so the user sees them
          start: new Date(ev.start),
          end: new Date(ev.end)
      }));
  }
};