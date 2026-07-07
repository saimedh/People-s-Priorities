const { GoogleGenerativeAI } = require("@google/generative-ai");
const Parser = require("rss-parser");

const GEMINI_KEY = process.env.GEMINI_API_KEY || "";
// Gemini REST API keys always start with "AIza"
const IS_VALID_GEMINI_KEY = GEMINI_KEY.startsWith("AIza") && GEMINI_KEY.length > 30;

const genAI = IS_VALID_GEMINI_KEY ? new GoogleGenerativeAI(GEMINI_KEY) : null;
const parser = new Parser({ timeout: 8000 });

// RSS fallback feeds
const RSS_FEEDS = {
  TS: [
    "https://www.deccanchronicle.com/rss/telangana",
    "https://www.thehindu.com/news/national/telangana/feeder/default.rss"
  ],
  AP: [
    "https://www.deccanchronicle.com/rss/andhra-pradesh",
    "https://www.thehindu.com/news/national/andhra-pradesh/feeder/default.rss"
  ]
};

// Rich mock data per state
function getMockData(district, state) {
  const isTS = state === "TS";
  return {
    issues: [
      {
        summary: `Traffic congestion reported near ${district} central junction during peak hours, affecting commuters.`,
        source_url: "https://example.com/news1"
      },
      {
        summary: `Residents in ${district} raise concerns about poor street lighting in residential colonies.`,
        source_url: "https://example.com/news2"
      },
      {
        summary: `Garbage collection delays reported in multiple wards of ${district} ${state}.`,
        source_url: "https://example.com/news3"
      }
    ],
    problems: [
      {
        summary: `Water supply disruption in ${district} due to pipeline maintenance. 12 hours expected downtime.`,
        source_url: "https://example.com/news4"
      },
      {
        summary: `School building in ${district} found with structural damage; GHMC inspection ordered.`,
        source_url: "https://example.com/news5"
      }
    ],
    good_news: [
      {
        summary: `${isTS ? "TSRTC" : "APSRTC"} launches new bus routes connecting ${district} to the city center.`,
        source_url: "https://example.com/news6"
      },
      {
        summary: `New community health center inaugurated in ${district}; to serve 50,000 residents.`,
        source_url: "https://example.com/news7"
      },
      {
        summary: `${isTS ? "Telangana" : "Andhra Pradesh"} government approves ₹12 Cr for ${district} road widening project.`,
        source_url: "https://example.com/news8"
      }
    ]
  };
}

// Safe JSON parse — strips markdown fences
function safeParseJSON(raw) {
  const cleaned = raw.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // Try to extract just the JSON object
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("Could not parse JSON from Gemini response");
  }
}

async function classifyArticles(articles, district, state) {
  if (!IS_VALID_GEMINI_KEY || articles.length === 0) {
    console.warn("No valid Gemini key or no articles — returning mock local pulse data.");
    return getMockData(district, state);
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const prompt = `Classify these news snippets into issues, problems, good_news for local development tracking in ${district}, ${state}.
  Return ONLY valid JSON (no markdown) in this format:
  {
    "issues": [{ "summary": "...", "source_url": "..." }],
    "problems": [{ "summary": "...", "source_url": "..." }],
    "good_news": [{ "summary": "...", "source_url": "..." }]
  }
  3 items per category max.
  Articles: ${JSON.stringify(articles.slice(0, 15))}`;

  try {
    const result = await model.generateContent(prompt);
    return safeParseJSON(result.response.text());
  } catch (err) {
    console.error("Gemini classification failed:", err.message);
    // Always fall back — never throw
    return getMockData(district, state);
  }
}

async function fetchLocalPulse(district, state) {
  try {
    // Try Gemini grounded search first
    if (IS_VALID_GEMINI_KEY) {
      try {
        const model = genAI.getGenerativeModel({
          model: "gemini-2.0-flash",
          tools: [{ googleSearch: {} }]
        });

        const prompt = `Search recent local news for ${district}, ${state}, India.
        Return ONLY valid JSON (no markdown), exactly:
        {
          "issues": [{ "summary": "...", "source_url": "..." }],
          "problems": [{ "summary": "...", "source_url": "..." }],
          "good_news": [{ "summary": "...", "source_url": "..." }]
        }
        3 items per category max. Focus on civic, infrastructure, school, water, health topics.`;

        const result = await model.generateContent(prompt);
        const parsed = safeParseJSON(result.response.text());
        if (parsed && (parsed.issues || parsed.problems || parsed.good_news)) {
          return parsed;
        }
      } catch (err) {
        console.log("Gemini grounded search failed, trying RSS fallback:", err.message);
      }
    } else {
      console.warn(`Invalid or missing Gemini API key. Using RSS/mock fallback.`);
    }

    // RSS Fallback
    const feeds = RSS_FEEDS[state] || RSS_FEEDS.TS;
    let articles = [];

    for (const feedUrl of feeds) {
      try {
        const feed = await parser.parseURL(feedUrl);
        const recent = feed.items.slice(0, 10).map(item => ({
          title: item.title,
          content: item.contentSnippet || item.content || "",
          link: item.link
        }));
        articles = articles.concat(recent);
      } catch (e) {
        console.error(`Failed to fetch RSS from ${feedUrl}:`, e.message);
      }
    }

    if (articles.length > 0) {
      const filtered = articles.filter(a =>
        a.title.toLowerCase().includes(district.toLowerCase()) ||
        a.content.toLowerCase().includes(district.toLowerCase())
      );
      const toClassify = filtered.length > 0 ? filtered : articles;
      return await classifyArticles(toClassify, district, state);
    }

    // Both failed — return mock
    console.warn("Both Gemini and RSS failed. Returning mock data.");
    return getMockData(district, state);

  } catch (outerErr) {
    // Absolute last resort — never crash the route
    console.error("fetchLocalPulse unexpected error:", outerErr.message);
    return getMockData(district, state);
  }
}

module.exports = { fetchLocalPulse, getMockData };
