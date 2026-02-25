export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{
          role: "user",
          content: 'Search for the next upcoming AFL 2025 season round fixtures. Also search for the current AFL ladder. Return ONLY a JSON object with no markdown, no backticks. Format: {"round":"Round X","fixtures":[{"home":"Team","away":"Team","venue":"Venue","time":"Day Time","night":true}],"top8":["Team1","Team2","Team3","Team4","Team5","Team6","Team7","Team8"],"note":"context"} Use full names: Adelaide, Brisbane, Carlton, Collingwood, Essendon, Fremantle, Geelong, Gold Coast, GWS, Hawthorn, Melbourne, North Melbourne, Port Adelaide, Richmond, St Kilda, Sydney, West Coast, Western Bulldogs.'
        }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: errText });
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
