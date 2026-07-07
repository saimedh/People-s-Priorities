const { GoogleGenerativeAI } = require('@google/generative-ai');

async function summarizeComplaints(complaintsList) {
  if (!process.env.GEMINI_API_KEY) {
    // Return mock data if no API key
    return JSON.stringify([
      {
        theme: 'Infrastructure Overcrowding',
        description: 'Multiple citizens report dangerously overcrowded schools with insufficient seating and facilities.',
        count: 8,
      },
      {
        theme: 'Youth Unemployment & Skills Gap',
        description: 'Young residents lack access to vocational training leading to high unemployment in the ward.',
        count: 6,
      },
      {
        theme: 'Distance & Accessibility Barriers',
        description: 'Communities in outer areas face long commutes to reach existing educational facilities.',
        count: 5,
      },
    ]);
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `You are analyzing citizen complaints about public infrastructure in a constituency.
Identify the top 3 recurring themes from these citizen complaints.
Return ONLY a valid JSON array with exactly 3 objects, each having:
- theme: a short theme title (max 5 words)
- description: one sentence summary
- count: estimated number of complaints on this theme

Complaints:
${JSON.stringify(complaintsList.map((c) => c.complaint_text))}

Return only the JSON array, no markdown, no explanation.`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    // Strip markdown code fences if present
    const clean = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    return clean;
  } catch (err) {
    console.error('Gemini error (falling back to mock):', err.message);
    return JSON.stringify([
      {
        theme: 'Infrastructure Overcrowding (Mock Fallback)',
        description: 'Multiple citizens report dangerously overcrowded schools with insufficient seating and facilities.',
        count: 8,
      },
      {
        theme: 'Youth Unemployment & Skills Gap',
        description: 'Young residents lack access to vocational training leading to high unemployment in the ward.',
        count: 6,
      },
      {
        theme: 'Distance & Accessibility Barriers',
        description: 'Communities in outer areas face long commutes to reach existing educational facilities.',
        count: 5,
      },
    ]);
  }
}

async function classifyComplaint(complaintText) {
  if (!process.env.GEMINI_API_KEY) {
    return { category: 'Other', priority_score: 50, priority_level: 'Medium' };
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `Analyze this citizen complaint: "${complaintText}"

Categorize it into one of these: Road, Water, Electricity, Drainage, Education, Healthcare, Transport, Agriculture, Welfare, Law & Order, Other.
Assign a priority score from 0 to 100 based on severity, population affected, and disaster risk.
Assign a priority level: Critical (80-100), High (60-79), Medium (30-59), Low (0-29).

Return ONLY a JSON object:
{
  "category": "string",
  "priority_score": number,
  "priority_level": "string"
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const clean = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    return JSON.parse(clean);
  } catch (err) {
    console.error('Gemini classification error (falling back to mock):', err.message);
    return { category: 'Other', priority_score: 50, priority_level: 'Medium' };
  }
}

module.exports = { summarizeComplaints, classifyComplaint };
