import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase limit to handle Base64 image payloads
app.use(express.json({ limit: "15mb" }));

// Initialize Gemini Client safely
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey && apiKey !== "MY_GEMINI_API_KEY" && apiKey !== "") {
  try {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    console.log("GoogleGenAI initialized successfully on the backend.");
  } catch (error) {
    console.error("Failed to initialize GoogleGenAI:", error);
  }
} else {
  console.log("No valid GEMINI_API_KEY found in process.env. Using local heuristics engine.");
}

// Local heuristics fallback engine when Gemini is unavailable
function getHeuristicsTriage(text: string) {
  const lower = text.toLowerCase();
  let category = "Infrastructure";
  let priority = "Medium";
  let reasoning = "Assigned via CampusFix Heuristics Engine (offline model).";

  // Categorize
  if (
    lower.includes("wifi") ||
    lower.includes("internet") ||
    lower.includes("signal") ||
    lower.includes("connection") ||
    lower.includes("router") ||
    lower.includes("network") ||
    lower.includes("ethernet")
  ) {
    category = "Connectivity";
  } else if (
    lower.includes("food") ||
    lower.includes("canteen") ||
    lower.includes("hygiene") ||
    lower.includes("mess") ||
    lower.includes("kitchen") ||
    lower.includes("spill") ||
    lower.includes("clean") ||
    lower.includes("dirty") ||
    lower.includes("utensils")
  ) {
    category = "Canteen & Hygiene";
  } else if (
    lower.includes("smoke") ||
    lower.includes("fire") ||
    lower.includes("wire") ||
    lower.includes("shock") ||
    lower.includes("hazard") ||
    lower.includes("safety") ||
    lower.includes("lock") ||
    lower.includes("stairwell") ||
    lower.includes("imminent") ||
    lower.includes("broken glass") ||
    lower.includes("emergency")
  ) {
    category = "Safety";
  }

  // Priority
  if (
    lower.includes("emergency") ||
    lower.includes("critical") ||
    lower.includes("fire") ||
    lower.includes("shock") ||
    lower.includes("hazardous") ||
    lower.includes("broken glass") ||
    lower.includes("imminent danger") ||
    lower.includes("slip hazard")
  ) {
    priority = "High";
    reasoning = `Priority: Escalated to High due to critical safety language ("${
      lower.match(/emergency|critical|fire|shock|hazard|danger|slip/)?.[0] || "danger"
    }"). ${reasoning}`;
  } else if (
    lower.includes("slow") ||
    lower.includes("minor") ||
    lower.includes("flicker") ||
    lower.includes("dripping") ||
    lower.includes("low") ||
    lower.includes("chirping")
  ) {
    priority = "Low";
    reasoning = `Priority: Set to Low as the issue description suggests dynamic latency but no immediate physical threat. ${reasoning}`;
  } else {
    priority = "Medium";
    reasoning = `Priority: Set to Medium for general operational disruptions. ${reasoning}`;
  }

  return { category, priority, reasoning };
}

// REST Triage Endpoint
app.post("/api/triage", async (req, res) => {
  const { report_text, building_tag, image_present, image_payload } = req.body;

  if (!report_text) {
    return res.status(400).json({ error: "Missing report_text" });
  }

  // 1. Attempt using modern @google/genai SDK
  if (ai) {
    try {
      console.log(`Sending triage request to Gemini 3.5 Flash for building: ${building_tag}`);
      const systemInstruction = `You are the CampusFix AI Triage engine. You auto-classify reports into exactly one of: 'Infrastructure', 'Canteen & Hygiene', 'Safety', 'Connectivity' and assign priority 'Low', 'Medium', or 'High'. Returns structured JSON.`;

      let contents: any[] = [];
      
      // If there is an image uploaded, include it
      if (image_present && image_payload) {
        // Extract raw base64 data from potential data-url
        const base64Data = image_payload.includes(",") 
          ? image_payload.split(",")[1] 
          : image_payload;
        
        contents.push({
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Data,
          }
        });
      }

      contents.push({
        text: `Classify this report:
Building: "${building_tag || "Unknown"}"
Description: "${report_text}"

You MUST output JSON that fits the target schema. Use the precise values:
- category: One of 'Infrastructure', 'Canteen & Hygiene', 'Safety', 'Connectivity'. Maintain spelling and case exactly.
- priority: One of 'Low', 'Medium', 'High'.
- reasoning: Short explanation of your classification.`
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              category: {
                type: Type.STRING,
                description: "Must be exactly: 'Infrastructure', 'Canteen & Hygiene', 'Safety', or 'Connectivity'"
              },
              priority: {
                type: Type.STRING,
                description: "Must be exactly: 'Low', 'Medium', or 'High'"
              },
              reasoning: {
                type: Type.STRING,
                description: "Reasoning for selection"
              }
            },
            required: ["category", "priority", "reasoning"]
          }
        }
      });

      const responseText = response.text;
      if (responseText) {
        const parsed = JSON.parse(responseText.trim());
        
        // Map 'Canteen' variations to exact category
        if (parsed.category === "Canteen" || parsed.category === "Canteen and Hygiene") {
          parsed.category = "Canteen & Hygiene";
        }
        
        // Ensure values are exact matches
        const finalCategory = ["Infrastructure", "Canteen & Hygiene", "Safety", "Connectivity"].includes(parsed.category)
          ? parsed.category
          : "Infrastructure";
          
        const finalPriority = ["Low", "Medium", "High"].includes(parsed.priority)
          ? parsed.priority
          : "Medium";

        return res.json({
          category: finalCategory,
          priority: finalPriority,
          reasoning: parsed.reasoning || "Triage completed automatically."
        });
      }
    } catch (err: any) {
      console.error("Gemini API triage failed. Falling back to diagnostics heuristics. Error:", err.message || err);
    }
  }

  // 2. Local Fallback Heuristics Engine
  const analysis = getHeuristicsTriage(report_text);
  return res.json(analysis);
});

// Setup Vite implementation or Serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware mounted.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Production static files server mounted.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CampusFix Express server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
