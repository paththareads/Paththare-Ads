export async function sendSMS({
  to,
  message,
}: {
  to: string;
  message: string;
}) {
  try {
    const smsMask = process.env.SMS_MASK?.trim();
    const apiToken = process.env.SMS_API_TOKEN?.trim();

    // Validate environment variables
    if (!smsMask || !apiToken) {
      throw new Error("SMS_MASK or SMS_API_TOKEN is missing");
    }

    // Format Sri Lankan mobile numbers
    // 0771234567   -> 94771234567
    // +94771234567 -> 94771234567
    // 94771234567  -> 94771234567

    let formatted = to.trim().replace(/[\s()-]/g, "");

    if (formatted.startsWith("+94")) {
      formatted = formatted.substring(1);
    } else if (formatted.startsWith("0")) {
      formatted = "94" + formatted.substring(1);
    }

    // Validate Sri Lankan mobile number
    if (!/^947\d{8}$/.test(formatted)) {
      throw new Error(`Invalid Sri Lankan mobile number: ${to}`);
    }

    // Validate SMS message
    if (!message.trim()) {
      throw new Error("SMS message cannot be empty");
    }

    // New Textmo SMS API endpoint
    const url = new URL("https://send.textmo.lk/api/send_sms.php");

    // Set query parameters and automatically URL-encode values
    url.searchParams.set("api_token", apiToken);
    url.searchParams.set("to", formatted);
    url.searchParams.set("message", message);
    url.searchParams.set("mask", smsMask);

    // Send GET request
    const res = await fetch(url.toString(), {
      method: "GET",
      cache: "no-store",
    });

    // Read API response
    const responseText = await res.text();

    console.log("Textmo SMS HTTP status:", res.status);
    console.log("Textmo SMS response:", responseText);

    // Handle HTTP errors
    if (!res.ok) {
      throw new Error(`Textmo SMS API failed (${res.status}): ${responseText}`);
    }

    // Attempt JSON parsing if the API returns JSON
    let data: unknown = responseText;

    try {
      data = JSON.parse(responseText);
    } catch {
      // Keep plain-text response
    }

    // Detect common explicit API errors
    if (data && typeof data === "object") {
      const result = data as Record<string, unknown>;

      if (
        result.success === false ||
        result.status === "error" ||
        result.status === "failed"
      ) {
        throw new Error(`Textmo rejected SMS: ${responseText}`);
      }
    }

    return {
      success: true,
      data,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.error("SMS sending failed:", errorMessage);

    return {
      success: false,
      error: errorMessage,
    };
  }
}
