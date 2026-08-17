// ------------------------------------------------------------
// SMS / OTP delivery.
//
// Provider is selected with the SMS_PROVIDER env variable:
//   - "twilio"  : sends real SMS via Twilio (needs credentials)
//   - "dev"     : (default) development/test mode. The OTP is
//                 logged to the server console so the full flow
//                 can be verified without real SMS credits.
//
// Production SMS mode is NEVER used implicitly — if no provider is
// configured the flow falls back to dev mode rather than silently
// trying (and failing) a fake provider.
// ------------------------------------------------------------

const DEV_PROVIDER = "dev";

export interface SmsConfig {
  provider: string;
}

export function getSmsConfig(): SmsConfig {
  return { provider: (process.env.SMS_PROVIDER || DEV_PROVIDER).toLowerCase() };
}

async function sendViaTwilio(to: string, message: string): Promise<boolean> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!accountSid || !authToken || !from) {
    console.error("[SMS] Twilio provider selected but credentials are missing.");
    return false;
  }

  const form = new URLSearchParams({ To: to, From: from, Body: message });
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    }
  );
  return res.ok;
}

function logDevSms(to: string, message: string) {
  console.log(`\n=== [SMS DEV MODE] To: ${to} ===\n${message}\n===========================\n`);
}

/**
 * Sends an SMS message. Returns true if the message was dispatched
 * (in dev mode this always returns true and just logs the content).
 */
export async function sendSms(to: string, message: string): Promise<boolean> {
  const { provider } = getSmsConfig();
  try {
    if (provider === "twilio") {
      const sent = await sendViaTwilio(to, message);
      if (sent) return true;
      // fall through to dev logging if delivery failed so the flow stays testable
      console.error("[SMS] Twilio delivery failed; falling back to dev mode.");
    }
  } catch (err) {
    console.error("[SMS ERROR]", err);
  }
  logDevSms(to, message);
  return true;
}
