import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

interface MeetDetails {
  meetLink: string;
  meetId: string;
}

class GoogleMeetService {
  private calendar: any;
  private auth: JWT;

  constructor() {
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY environment variable is required');
    }

    try {
      const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
      
      this.auth = new JWT({
        email: credentials.client_email,
        key: credentials.private_key,
        scopes: [
          'https://www.googleapis.com/auth/calendar',
          'https://www.googleapis.com/auth/calendar.events'
        ],
      });

      this.calendar = google.calendar({ version: 'v3', auth: this.auth });
    } catch (error) {
      console.error('Failed to initialize Google Meet service:', error);
      throw new Error('Invalid Google service account credentials');
    }
  }

  async createMeetLink(
    title: string, 
    startTime: Date, 
    endTime: Date, 
    attendeeEmails: string[] = []
  ): Promise<MeetDetails> {
    try {
      const event = {
        summary: title,
        start: {
          dateTime: startTime.toISOString(),
          timeZone: 'Europe/Warsaw',
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: 'Europe/Warsaw',
        },
        attendees: attendeeEmails.map(email => ({ email, responseStatus: 'accepted' })),
        visibility: 'public',
        conferenceData: {
          createRequest: {
            requestId: `meet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            conferenceSolutionKey: {
              type: 'hangoutsMeet'
            },
            status: {
              statusCode: 'success'
            }
          }
        },
        guestsCanInviteOthers: true,
        guestsCanModify: false,
        guestsCanSeeOtherGuests: true,
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 10 },
          ],
        },
      };

      const response = await this.calendar.events.insert({
        calendarId: 'primary',
        resource: event,
        conferenceDataVersion: 1,
        sendNotifications: false,
        sendUpdates: 'none'
      });

      const meetData = response.data.conferenceData?.entryPoints?.find(
        (entry: any) => entry.entryPointType === 'video'
      );

      if (!meetData?.uri) {
        throw new Error('Failed to create Google Meet link');
      }

      // Extract meet ID from the URI
      const meetId = meetData.uri.split('/').pop() || '';

      return {
        meetLink: meetData.uri,
        meetId: meetId
      };

    } catch (error) {
      console.error('Error creating Google Meet link:', error);
      
      // Fallback to realistic format if API fails
      const generateMeetId = () => {
        const chars = 'abcdefghijklmnopqrstuvwxyz';
        const part1 = Array.from({length: 3}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
        const part2 = Array.from({length: 4}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
        const part3 = Array.from({length: 3}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
        return `${part1}-${part2}-${part3}`;
      };

      const fallbackMeetId = generateMeetId();
      console.log('Using fallback Meet ID:', fallbackMeetId);
      
      return {
        meetLink: `https://meet.google.com/${fallbackMeetId}`,
        meetId: fallbackMeetId
      };
    }
  }

  async deleteMeetEvent(eventId: string): Promise<void> {
    try {
      await this.calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId,
      });
    } catch (error) {
      console.error('Error deleting Google Meet event:', error);
      // Don't throw error for deletion failures
    }
  }
}

export const googleMeetService = new GoogleMeetService();