export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { prompt, feature, systemPrompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) return res.status(500).json({ error: 'GROQ_API_KEY not set in Vercel Environment Variables' });

  const defaultSystem = `You are Genie Code — an expert AI data engineer for Databricks, Power BI, Snowflake, NetSuite, and Azure Synapse. Return ONLY valid JSON (no markdown, no backticks):
{"thoughts":"your analysis","steps":[{"title":"step name","done":true}],"explanation":"what this does","code":"actual code here","lang":"python","notes":"tips","tableCount":8,"assetCount":15,"sqlQuery":"SELECT volume_name, volume_catalog, volume_schema, volume_type FROM information_schema.volumes WHERE volume_schema = 'genie_code' LIMIT 20","pipelineName":"pipeline_name"}`;

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
          { role: 'system', content: systemPrompt || defaultSystem },
          { role: 'user', content: prompt }
        ],
        max_tokens: 2048,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: `Groq API error: ${err}` });
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content || '';
    return res.status(200).json({ result, response: result });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
