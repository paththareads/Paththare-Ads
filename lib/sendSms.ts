// lib/sendSms.ts

export async function sendSMS({
  to,
  message,
}: {
  to: string;
  message: string;
}) {
  try {
    // Format Sri Lankan number (077 → +9477)
    let formatted = to;
    if (to.startsWith("0")) {
      formatted = "94" + to.substring(1);
    }
    if (to.startsWith("+94")) {
      formatted = to.replace("+", "");
    }

    console.log(formatted)
    const smsMask = process.env.SMS_MASK

    const url = `https://portal.richmo.lk/api/sms/send/?dst=${formatted}&from=${smsMask}&msg=${encodeURIComponent(
      message
    )}`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.SMS_API_TOKEN}`,
      },
    });

    const data = await res.text();
    console.log("SMS response not encoded:", res);

    console.log("SMS response:", data);

    return { success: true, data };
  } catch (error: any) {
    console.error("SMS sending failed:", error);
    return { success: false, error: error.message };
  }
}