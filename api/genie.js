export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
 
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
 
  const { prompt, feature, systemPrompt, mode } = req.body || {};
 
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }
 
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) {
    return res.status(500).json({ error: 'GROQ_API_KEY not set in Vercel Environment Variables' });
  }
 
  // 🔥 ASSIST MODE PROMPTS
  const assistSystems = {
    databricks: `You are Genie Code in ASSIST mode for Databricks.
 
Rules:
- Give direct, clean answers
- If code needed → give full runnable code
- No fake steps
- No fake logs
- Keep it simple
 
Return ONLY JSON:
{"thoughts":"brief reasoning","explanation":"direct answer","code":"code if needed else empty","lang":"python","notes":"short tips","steps":[]}`,
 
    powerbi: `You are Genie Code in ASSIST mode for Power BI.
Return ONLY JSON:
{"thoughts":"brief reasoning","explanation":"direct answer","code":"DAX code if needed","lang":"dax","notes":"tips","steps":[]}`,
 
    snowflake: `You are Genie Code in ASSIST mode for Snowflake.
Return ONLY JSON:
{"thoughts":"brief reasoning","explanation":"direct answer","code":"SQL code if needed","lang":"sql","notes":"tips","steps":[]}`,
 
    netsuite: `You are Genie Code in ASSIST mode for NetSuite.
Return ONLY JSON:
{"thoughts":"brief reasoning","explanation":"direct answer","code":"SuiteQL code if needed","lang":"sql","notes":"tips","steps":[]}`,
 
    synapse: `You are Genie Code in ASSIST mode for Synapse.
Return ONLY JSON:
{"thoughts":"brief reasoning","explanation":"direct answer","code":"code if needed","lang":"python","notes":"tips","steps":[]}`
  };
 
  // 🔥 DEFAULT AGENT PROMPT
  const defaultAgentSystem = `You are Genie Code — an expert AI data engineer working in AGENT mode.
 
Rules:
- Think step by step
- Generate full production-ready code
- Use best practices
- No markdown
- No backticks
- Output ONLY JSON
 
Format:
{"thoughts":"analysis","steps":[{"title":"step","done":true}],"explanation":"what this does","code":"code","lang":"python","notes":"tips","pipelineName":"name"}`;
 
  const finalSystem =
    mode === "assist"
      ? (assistSystems[feature] || assistSystems.databricks)
      : (systemPrompt || defaultAgentSystem);
 
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: finalSystem },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 2048
      })
    });
 
    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: errText });
    }
 
    const data = await response.json();
    let result = data.choices?.[0]?.message?.content || '';
 
    // 🛡️ SAFE JSON FIX
    try {
      JSON.parse(result);
    } catch {
      result = JSON.stringify({
        thoughts: "",
        explanation: result || "Response generated.",
        code: "",
        lang: "python",
        notes: "",
        steps: []
      });
    }
 
    return res.status(200).json({
      result,
      response: result
    });
 
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
