/**
 * Sends an SMS when Twilio credentials are set.
 * Without them, the message is logged so the lab can still demo the alert path.
 */
export async function sendSms(to: string, body: string): Promise<boolean> {
  const sid = process.env.TWILIO_ACCOUNT_SID || '';
  const token = process.env.TWILIO_AUTH_TOKEN || '';
  const from = process.env.TWILIO_FROM_NUMBER || '';

  if (!sid || !token || !from) {
    console.log(`[SMS skipped] To: ${to}, Body: ${body}`);
    return false;
  }

  const auth = Buffer.from(`${sid}:${token}`).toString('base64');
  const payload = new URLSearchParams({ To: to, From: from, Body: body });

  try {
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: payload,
    });
    if (!response.ok) {
      console.error('SMS send failed:', response.status, await response.text());
      return false;
    }
    return true;
  } catch (error) {
    console.error('SMS send failed:', error);
    return false;
  }
}
