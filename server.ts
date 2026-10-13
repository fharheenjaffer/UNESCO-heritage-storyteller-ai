import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { DEFAULT_MONUMENT_KNOWLEDGE } from './src/data/defaultKnowledge.ts';
import { MonumentKnowledgeDoc, StoryMode } from './src/types.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory knowledge base, initialized with verified default Indian monument knowledge files
let knowledgeBase: MonumentKnowledgeDoc[] = [...DEFAULT_MONUMENT_KNOWLEDGE];

// Lazy/safe initialization of Gemini AI
let genAI: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY environment variable is not set. Using fallback responses if needed.');
    }
    genAI = new GoogleGenAI({
      apiKey: apiKey || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAI;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Endpoints

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      monumentsCount: knowledgeBase.length,
      hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  // Get all monument knowledge documents
  app.get('/api/monuments', (req, res) => {
    const summaries = knowledgeBase.map((m) => ({
      id: m.id,
      name: m.name,
      location: m.location,
      state: m.state,
      builtBy: m.builtBy,
      era: m.era,
      century: m.century,
      unescoStatus: m.unescoStatus,
      highlights: m.highlights,
      thumbnailDescription: m.thumbnailDescription,
      isCustom: m.isCustom || false,
      uploadedAt: m.uploadedAt,
      contentLength: m.content.length,
    }));
    res.json(summaries);
  });

  // Get a single monument document by ID
  app.get('/api/monuments/:id', (req, res) => {
    const doc = knowledgeBase.find((m) => m.id === req.params.id);
    if (!doc) {
      res.status(404).json({ error: 'Monument knowledge document not found' });
      return;
    }
    res.json(doc);
  });

  // Upload/Add a new monument knowledge document
  app.post('/api/knowledge/upload', (req, res) => {
    try {
      const { name, location, state, content, builtBy, era, century, unescoStatus, highlights, thumbnailDescription } = req.body;

      if (!name || !content) {
        res.status(400).json({ error: 'Monument name and content are required.' });
        return;
      }

      const id = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-4);

      const newDoc: MonumentKnowledgeDoc = {
        id,
        name: name.trim(),
        location: (location || 'India').trim(),
        state: (state || '').trim(),
        builtBy: builtBy || 'Historical Records',
        era: era || 'Historical India',
        century: century || 'Recorded in knowledge base',
        unescoStatus: Boolean(unescoStatus),
        highlights: Array.isArray(highlights) && highlights.length > 0 ? highlights : ['Custom Uploaded Knowledge File'],
        thumbnailDescription: thumbnailDescription || `User uploaded monument document for ${name}`,
        content: content.trim(),
        isCustom: true,
        uploadedAt: new Date().toISOString(),
      };

      knowledgeBase.push(newDoc);
      res.status(201).json({ success: true, document: newDoc });
    } catch (err: any) {
      console.error('Error uploading knowledge document:', err);
      res.status(500).json({ error: err.message || 'Failed to upload knowledge document' });
    }
  });

  // Reset to default monuments knowledge base
  app.post('/api/knowledge/reset', (req, res) => {
    knowledgeBase = [...DEFAULT_MONUMENT_KNOWLEDGE];
    res.json({ success: true, count: knowledgeBase.length });
  });

  // Delete a custom monument knowledge document
  app.delete('/api/knowledge/:id', (req, res) => {
    const id = req.params.id;
    const initialLength = knowledgeBase.length;
    knowledgeBase = knowledgeBase.filter((m) => m.id !== id);
    if (knowledgeBase.length < initialLength) {
      res.json({ success: true, message: 'Document removed' });
    } else {
      res.status(404).json({ error: 'Document not found' });
    }
  });

  // Helper to build high-fidelity grounded responses strictly from monument knowledge docs
  function buildGroundedResponse(
    matched: MonumentKnowledgeDoc,
    requestedMode: StoryMode,
    secondMonument?: MonumentKnowledgeDoc
  ): string {
    const historyText = matched.history?.join('\n\n') || '';
    const archText = matched.architecture || matched.highlights?.join(', ') || '';
    const factsList = matched.facts && matched.facts.length > 0
      ? matched.facts.map((f) => `- ${f}`).join('\n')
      : (matched.highlights?.map((h) => `- ${h}`).join('\n') || '- Distinctive landmark of Indian cultural heritage.');

    if (requestedMode === 'compare' && secondMonument) {
      return `## Monument Comparison: ${matched.name} vs. ${secondMonument.name}

### Monument Overview
- **${matched.name}**: Located in ${matched.location}${matched.unesco_year ? `, inscribed as a UNESCO World Heritage Site in ${matched.unesco_year}` : ''}.
- **${secondMonument.name}**: Located in ${secondMonument.location}${secondMonument.unesco_year ? `, inscribed as a UNESCO World Heritage Site in ${secondMonument.unesco_year}` : ''}.

### Historical Background
- **${matched.name}**: ${matched.history?.[0] || 'A landmark steeped in Indian regional and imperial history.'}
- **${secondMonument.name}**: ${secondMonument.history?.[0] || 'A monument of outstanding cultural and historic significance.'}

### Architectural Highlights
- **${matched.name}**: ${matched.architecture}
- **${secondMonument.name}**: ${secondMonument.architecture}

### Notable Facts & Distinctions
- **${matched.name}**: ${matched.facts?.[0] || 'Preserved under national heritage stewardship.'}
- **${secondMonument.name}**: ${secondMonument.facts?.[0] || 'Celebrated across global architectural records.'}

### Storytelling Experience
Standing before both monuments, one experiences the remarkable continuum of Indian art and craftsmanship—from the intricate stonecarving and soaring domes to the sacred atmospheres that have welcomed pilgrims and travelers across the centuries.

Would you like to explore another monument?`;
    }

    const typeDesc = matched.name.toLowerCase().includes('cave')
      ? 'rock-cut monuments'
      : matched.name.toLowerCase().includes('temple')
      ? 'sacred architectural sanctuaries'
      : matched.name.toLowerCase().includes('fort')
      ? 'historic fortresses'
      : 'historical monuments';

    if (requestedMode === 'story') {
      // Respond in storytelling mode with friendly audio guide welcome
      return `## Monument Overview
**Monument:** ${matched.name}  
**Location:** ${matched.location}${matched.unesco_year ? ` (UNESCO Inscribed ${matched.unesco_year})` : ''}

## Storytelling Experience
Welcome to ${matched.name}, one of India's most remarkable ${typeDesc}! Standing before this awe-inspiring site in ${matched.location}, the air feels quiet, filled with the resonance of centuries past.

${historyText ? `Centuries ago, ${historyText.split('\n\n')[0]}` : ''}

Looking up, the architecture leaves you in breathless awe. ${archText}

Run your fingers along the cool, weather-smoothed stone. Every archway frames a view of ancient ingenuity; every chisel mark echoes the devotion of thousands of master artisans who brought this vision to life. As daylight softens into twilight, lanterns cast warm shadows upon the historic grounds, whispering stories of dynastic splendor, spiritual dedication, and enduring cultural heritage.

Would you like to explore another monument?`;
    }

    if (requestedMode === 'guide') {
      // Act as a professional tour guide walking visitors through the monument
      return `## Guided Tour: Welcome to ${matched.name}!

"Good morning, everyone! Please gather close as we begin our guided tour of **${matched.name}**, right here in ${matched.location}. Look up at the grand entrance—take in the scale and proportion of what ancient builders achieved here.

## Historical Background
"Let's pause right here on the pathway while I share the history with you. ${historyText || `This monument was built centuries ago and remains a treasured beacon of regional heritage.`}

## Architectural Highlights
"Now, look closely as we approach the main structure. ${archText} Notice the precision of the stone joinery and the way natural light is filtered into the sanctum.

## Interesting Facts
"Before we proceed to the inner sanctum, let me highlight a few extraordinary facts:
${factsList}

## Storytelling Experience
"Take a moment to listen to the soft echoes inside this corridor. Imagine the royal processions, the chanting of prayers, and the footfalls of travelers who stood in this exact spot hundreds of years before us. It is an honor to walk through history with you today!"

Would you like to explore another monument?`;
    }

    if (requestedMode === 'child') {
      // Explain using simple language suitable for a 10-year-old
      return `## Monument Overview
**${matched.name}** is an amazing historical monument located in ${matched.location}! It's like a giant time machine built out of stone.

## Historical Background
A long time ago, ${historyText ? historyText.split('.')[0] + '.' : 'ancient kings and queens built this incredible place.'} Thousands of builders and artists worked together for many years like an ancient superhero team to construct it!

## Architectural Highlights
Look at how cool the building is! ${archText} It has huge stone pillars, secret designs, and special windows that let the sunlight shine through like magic.

## Interesting Facts
${factsList}

## Storytelling Experience
Close your eyes and pretend you are an ancient explorer wearing a royal cloak! You step through giant wooden doors, hear birds chirping in the courtyards, and find secret carvings on the walls. It feels like stepping right into your favorite adventure story!

Would you like to explore another monument?`;
    }

    if (requestedMode === 'facts') {
      // Respond using concise bullet points
      return `## Monument Overview
- **Monument Name:** ${matched.name}
- **Location:** ${matched.location}
- **UNESCO Status:** ${matched.unesco_year ? `UNESCO World Heritage Site (Inscribed ${matched.unesco_year})` : 'Nationally Protected Monument'}

## Historical Background
${matched.history && matched.history.length > 0 ? matched.history.map((h) => `- ${h}`).join('\n') : `- Historically significant monument in ${matched.location}.`}

## Architectural Highlights
- **Design & Materials:** ${archText}

## Interesting Facts
${factsList}

## Storytelling Experience
- **Visitor Experience:** Immersive historical journey showcasing the artistic heights, mathematical precision, and cultural legacy of India.

Would you like to explore another monument?`;
    }

    // Standard format following exact 5 section headers
    return `## Monument Overview
Welcome to **${matched.name}**, one of India's most remarkable ${typeDesc}! Located in ${matched.location}${matched.unesco_year ? `, inscribed as a UNESCO World Heritage Site in ${matched.unesco_year}` : ''}.

## Historical Background
${historyText || `${matched.name} is one of India's preeminent historical monuments, constructed as a testament to cultural vitality, architectural innovation, and imperial patronage.`}

## Architectural Highlights
${archText}

## Interesting Facts
${factsList}

## Storytelling Experience
Imagine standing beneath the towering arches of ${matched.name} as the morning mist rises over ${matched.location}. The stones beneath your feet have witnessed the march of centuries—royal decrees, philosophical discourses, and the vibrant life of historic India. As the sun sets, casting long amber shadows across the ornate stonework, the monument feels alive with the spirit and artistry of the generations who created it.

Would you like to explore another monument?`;
  }

  // Storyteller AI chat endpoint
  app.post('/api/storyteller/chat', async (req, res) => {
    try {
      const { message, mode = 'standard', monumentId, customKnowledgeDocs } = req.body;

      if (!message || typeof message !== 'string') {
        res.status(400).json({ error: 'A valid message string is required.' });
        return;
      }

      // Merge current knowledge base with any ephemeral client docs if provided
      let currentKnowledge = [...knowledgeBase];
      if (Array.isArray(customKnowledgeDocs) && customKnowledgeDocs.length > 0) {
        for (const doc of customKnowledgeDocs) {
          if (!currentKnowledge.some((k) => k.id === doc.id)) {
            currentKnowledge.push(doc);
          }
        }
      }

      const cleanMsg = message.toLowerCase();

      // Check for unindexed / foreign monuments or out-of-scope entities
      const unindexedKeywords = [
        'eiffel tower',
        'colosseum',
        'statue of liberty',
        'pyramid of giza',
        'great wall of china',
        'machu picchu',
        'stonehenge',
        'petra',
        'christ the redeemer',
        'leaning tower of pisa',
        'acropolis',
        'big ben',
        'kremlin',
        'sydney opera house',
        'notre dame',
        'burj khalifa',
        'louvre',
        'empire state building',
      ];
      const isExplicitlyUnindexed = unindexedKeywords.some((k) => cleanMsg.includes(k));

      if (isExplicitlyUnindexed) {
        res.json({
          reply: 'I could not find this information in my monument knowledge collection.',
          isNotFound: true,
        });
        return;
      }

      // Identify all mentioned monuments in the user's message
      const matchedMonuments: MonumentKnowledgeDoc[] = [];
      for (const m of currentKnowledge) {
        const nameLower = m.name.toLowerCase();
        const baseName = nameLower.replace(/\s*\([^)]*\)/g, '').trim();
        const idLower = m.id.toLowerCase().replace(/_/g, ' ');

        // Check inside parentheses, e.g. "(Lal Qila)" -> "lal qila"
        const parentheticalMatch = nameLower.match(/\(([^)]+)\)/);
        const parenText = parentheticalMatch ? parentheticalMatch[1].trim() : '';

        // Check comma-separated tokens, e.g. "Sun Temple, Konark" -> ["sun temple", "konark"]
        const commaParts = nameLower.split(',').map((p) => p.trim());

        const matches =
          cleanMsg.includes(nameLower) ||
          cleanMsg.includes(idLower) ||
          (baseName.length > 3 && cleanMsg.includes(baseName)) ||
          (parenText.length > 3 && cleanMsg.includes(parenText)) ||
          commaParts.some((part) => part.length > 4 && cleanMsg.includes(part));

        if (matches) {
          if (!matchedMonuments.some((existing) => existing.id === m.id)) {
            matchedMonuments.push(m);
          }
        }
      }

      // Sort matched monuments by longest matching name to prevent false supersets
      matchedMonuments.sort((a, b) => b.name.length - a.name.length);

      // Determine effective mode
      let effectiveMode: StoryMode = mode as StoryMode;
      if (cleanMsg.includes('tell me a story') || cleanMsg.includes('tell a story')) {
        effectiveMode = 'story';
      } else if (cleanMsg.includes('explain for a child') || cleanMsg.includes('for a 10-year-old') || cleanMsg.includes('for kids')) {
        effectiveMode = 'child';
      } else if (cleanMsg.includes('give me facts') || cleanMsg.includes('give facts') || cleanMsg.includes('facts only')) {
        effectiveMode = 'facts';
      } else if (cleanMsg.includes('act as a tourist guide') || cleanMsg.includes('tourist guide') || cleanMsg.includes('tour guide')) {
        effectiveMode = 'guide';
      } else if (cleanMsg.includes('compare monuments') || cleanMsg.includes('compare ') || effectiveMode === 'compare') {
        effectiveMode = 'compare';
      }

      // Select primary matched monument
      let primaryMonument: MonumentKnowledgeDoc | undefined = matchedMonuments[0];
      let secondaryMonument: MonumentKnowledgeDoc | undefined = matchedMonuments[1];

      if (!primaryMonument && monumentId) {
        primaryMonument = currentKnowledge.find((m) => m.id === monumentId);
      }

      // If comparing and only 1 monument matched, pick a relevant second monument from the dataset
      if (effectiveMode === 'compare' && primaryMonument && !secondaryMonument) {
        secondaryMonument = currentKnowledge.find((m) => m.id !== primaryMonument!.id);
      }

      // If neither monument matched nor active monument exists, check if query is about monuments at all
      if (!primaryMonument) {
        // If the query asks for unknown or general info not in knowledge collection
        const hasIndianHeritageKeyword = [
          'monument',
          'heritage',
          'temple',
          'fort',
          'tomb',
          'palace',
          'caves',
          'stupa',
          'minar',
          'pillar',
          'architecture',
        ].some((kw) => cleanMsg.includes(kw));

        if (!hasIndianHeritageKeyword) {
          res.json({
            reply: 'I could not find this information in my monument knowledge collection.',
            isNotFound: true,
          });
          return;
        }

        // Default to first monument (e.g. Taj Mahal) if user asked generally about monuments
        primaryMonument = currentKnowledge[0];
      }

      // Build knowledge collection text context
      const knowledgeContext = currentKnowledge
        .map((doc, idx) => `=== KNOWLEDGE FILE #${idx + 1}: ${doc.name} ===\n${doc.content}`)
        .join('\n\n');

      const systemPrompt = `# ROLE
You are Heritage Storyteller AI, a friendly heritage guide and expert narrator specializing in Indian historical monuments and UNESCO World Heritage sites.
When users ask about a monument (e.g. "Tell me the story of Ellora Caves"), introduce it as a friendly audio tour guide:
"Welcome to [Monument Name], one of India's most remarkable [monuments/rock-cut sanctuaries/architectural wonders]..."
Keep voice narration sounding like an engaging, educational audio tour guide.

Your knowledge comes primarily from the uploaded monument dataset.

# PRIMARY OBJECTIVE
Help users learn about Indian monuments through accurate, engaging, and educational storytelling.

# KNOWLEDGE RULES
1. Use information from the uploaded dataset whenever possible.
2. Never invent historical facts.
3. If information is not present in the dataset, clearly say:
   "I could not find this information in my monument knowledge collection."
4. Do not guess dates, rulers, architectural details, or historical events.

# RESPONSE FORMAT
For monument-related questions, organize answers in the following structure:

## Monument Overview
Provide monument name and location.

## Historical Background
Explain when it was built, by whom, and why it is important.

## Architectural Highlights
Describe architecture, design, materials, and notable structures.

## Interesting Facts
Provide 3–5 interesting facts in bullet points.

## Storytelling Experience
Create an engaging narrative that helps the user imagine visiting the monument.

# SPECIAL MODES
If the user asks:
"Tell me a story"
→ Respond entirely in storytelling mode.

"Act as a tourist guide"
→ Act as a professional tour guide walking visitors through the monument.

"Explain for a child"
→ Explain using simple language suitable for a 10-year-old.

"Give me facts"
→ Respond using concise bullet points.

"Compare monuments"
→ Compare using information available in the dataset.

# STORYTELLING STYLE
When creating stories:
- Be vivid and immersive.
- Describe surroundings, atmosphere, architecture, and historical context.
- Make users feel as though they are visiting the monument.
- Maintain historical accuracy.
- Avoid fictional events.

# TONE
- Educational
- Friendly
- Professional
- Engaging
- Respectful of cultural heritage

# ENDING
Whenever appropriate, conclude with:
"Would you like to explore another monument?"

=== UPLOADED MONUMENT KNOWLEDGE COLLECTION ===
${knowledgeContext}
=================================================`;

      let userInstruction = `User Query: "${message}"`;
      if (primaryMonument) {
        userInstruction += `\nTarget Monument 1: ${primaryMonument.name} (${primaryMonument.location})`;
      }
      if (secondaryMonument) {
        userInstruction += `\nTarget Monument 2: ${secondaryMonument.name} (${secondaryMonument.location})`;
      }
      userInstruction += `\nRequested Mode: ${effectiveMode}`;

      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        res.json({
          reply: buildGroundedResponse(primaryMonument, effectiveMode, secondaryMonument),
          isNotFound: false,
          monumentName: primaryMonument.name,
          monumentLocation: primaryMonument.location,
        });
        return;
      }

      // Attempt Gemini call with grounded synthesis fallback with fast timeout
      let replyText = '';
      try {
        const ai = getGenAI();
        const callGeminiWithTimeout = async (model: string, timeoutMs = 2000) => {
          return Promise.race([
            ai.models.generateContent({
              model,
              contents: userInstruction,
              config: {
                systemInstruction: systemPrompt,
                temperature: 0.2,
              },
            }),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Timeout waiting for Gemini response')), timeoutMs)
            ),
          ]);
        };

        const candidateModels = ['gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-flash-latest'];
        for (const modelCandidate of candidateModels) {
          try {
            const response = await callGeminiWithTimeout(modelCandidate, 1800);
            if (response && response.text && response.text.trim().length > 0) {
              replyText = response.text;
              break;
            }
          } catch {
            // Silently try next candidate or proceed to grounded knowledge synthesis
            continue;
          }
        }
      } catch {
        // Fallback to grounded knowledge synthesis
      }

      if (!replyText || replyText.trim() === '') {
        replyText = buildGroundedResponse(primaryMonument, effectiveMode, secondaryMonument);
      }

      const isNotFound = replyText.includes('I could not find this information in my monument knowledge collection.');

      res.json({
        reply: replyText.trim(),
        isNotFound,
        monumentName: primaryMonument?.name,
        monumentLocation: primaryMonument?.location,
      });
    } catch (error: any) {
      console.error('Error in storyteller chat API:', error);
      const reqMode = (req.body?.mode || 'standard') as StoryMode;
      const matched = knowledgeBase.find((m) => req.body?.monumentId && m.id === req.body.monumentId) || knowledgeBase[0];
      if (matched) {
        res.json({
          reply: buildGroundedResponse(matched, reqMode),
          isNotFound: false,
          monumentName: matched.name,
          monumentLocation: matched.location,
        });
        return;
      }
      res.json({
        reply: 'I could not find this information in my monument knowledge collection.',
        isNotFound: true,
      });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Heritage Storyteller AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
