export async function auroraClaude(prompt: string) {
  const key = process.env.ANTHROPIC_API_KEY;

  if (!key) {
    throw new Error("ANTHROPIC_API_KEY missing");
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5",
      max_tokens: 500,
      messages: [
        { role: "user", content: prompt }
      ]
    })
  });

  if (!res.ok) {
    throw new Error("Claude API error: " + await res.text());
  }

  const data = await res.json();
  return data;
}
