import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/calendar.events'];

/**
 * Creates a Google Calendar event with a Google Meet conference link.
 * Returns the Meet URL or null if credentials are not configured.
 */
export async function createGoogleMeetEvent(
  summary: string,
  description: string,
  startDateTime: Date,
  durationMinutes: number,
  attendees: string[],
): Promise<string | null> {
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!serviceAccountEmail || !privateKey) {
    console.log('Google Calendar credentials not configured — skipping Meet generation');
    return null;
  }

  try {
    const auth = new google.auth.JWT({
      email: serviceAccountEmail,
      key: privateKey.replace(/\\n/g, '\n'),
      scopes: SCOPES,
    });

    const calendar = google.calendar({ version: 'v3', auth });

    const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60 * 1000);

    const event = await calendar.events.insert({
      calendarId: 'primary',
      conferenceDataVersion: 1,
      requestBody: {
        summary,
        description,
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: 'Africa/Lagos',
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: 'Africa/Lagos',
        },
        attendees: attendees.map((email) => ({ email })),
        conferenceData: {
          createRequest: {
            requestId: `advisora-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
            conferenceSolutionKey: {
              type: 'hangoutsMeet',
            },
          },
        },
      },
    });

    const meetLink = event.data.hangoutLink || event.data.conferenceData?.entryPoints?.find(
      (ep: any) => ep.entryPointType === 'video',
    )?.uri;

    return meetLink || null;
  } catch (error) {
    console.error('Failed to create Google Meet event:', (error as Error).message);
    return null;
  }
}