export async function checkProfanity(text: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://www.purgomalum.com/service/containsprofanity?text=${encodeURIComponent(
        text
      )}`
    );
    const result = await res.text(); // "true" or "false"
    return result === "true";
  } catch (err) {
    console.error("Profanity check failed", err);
    return false; // fail-safe
  }
}
