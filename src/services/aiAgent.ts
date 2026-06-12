import { GoogleGenerativeAI } from "@google/generative-ai";

export interface AIAction {
    action: "CREATE" | "UPDATE" | "DELETE";
    title?: string;
    description?: string;
    date?: string; // YYYY-MM-DD
    subject_id?: string;
    type_id?: string;
    event_id?: string; // only for UPDATE/DELETE
    reasoning: string;
}

export async function processAiPrompt(
    prompt: string,
    subjects: any[],
    eventTypes: any[],
    existingEvents: any[],
    provider: "gemini" | "openrouter" = "gemini"
): Promise<AIAction[]> {
    // Build the system instructions with full context
    const systemPrompt = `
You are an expert AI Event Manager for a university cohort. Your job is to parse the user's natural language request and output a strict JSON array of actions.

IMPORTANT CONTEXT:
Today's Date: ${new Date().toISOString().split('T')[0]}

AVAILABLE SUBJECTS (You can ONLY use these subject_ids):
${JSON.stringify(subjects.map(s => ({ id: s.id, name: s.name })), null, 2)}

AVAILABLE EVENT TYPES (You can ONLY use these type_ids):
${JSON.stringify(eventTypes.map(e => ({ id: e.id, name: e.name })), null, 2)}

EXISTING UPCOMING EVENTS (Use these event_ids if user asks to update or delete an event):
${JSON.stringify(existingEvents.map(e => ({ id: e.id, title: e.title, date: e.date, subject: e.subjects?.name })), null, 2)}

RULES:
1. Fuzzy match subject names and acronyms (e.g., "DB" -> "Database Management Systems", "OS" -> "Operating Systems").
2. Only output a JSON array of objects.
3. Use this exact schema for each object:
{
  "action": "CREATE" | "UPDATE" | "DELETE",
  "title": string (if CREATE or UPDATE, give it a professional title),
  "description": string (if CREATE or UPDATE),
  "date": string "YYYY-MM-DD" (if CREATE or UPDATE),
  "subject_id": string (if CREATE, use the exact ID from AVAILABLE SUBJECTS),
  "type_id": string (if CREATE or UPDATE, use the exact ID from AVAILABLE EVENT TYPES),
  "event_id": string (REQUIRED if UPDATE or DELETE, match using EXISTING UPCOMING EVENTS),
  "reasoning": string (Brief explanation of why this action was taken and what fuzzy matching was used)
}

If a subject or event cannot be found, DO NOT create an action for it. Ensure the date is formatted as YYYY-MM-DD. ONLY RETURN VALID JSON ARRAY.
`;

    try {
        if (provider === "gemini") {
            const apiKey = localStorage.getItem("gemini_api_key");
            if (!apiKey) throw new Error("No Gemini API Key found. Please save it in Settings first.");
            
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

            const result = await model.generateContent({
                contents: [
                    { role: "user", parts: [{ text: systemPrompt }] },
                    { role: "user", parts: [{ text: "CR Request: " + prompt }] }
                ],
                generationConfig: {
                    temperature: 0.1,
                    responseMimeType: "application/json"
                }
            });

            const text = result.response.text();
            const actions: AIAction[] = JSON.parse(text);
            return actions;
        } else {
            const apiKey = localStorage.getItem("openrouter_api_key");
            if (!apiKey) throw new Error("No OpenRouter API Key found. Please save it in Settings first.");

            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "openai/gpt-4o-mini", // Using 4o-mini as requested alternative
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: "CR Request: " + prompt }
                    ],
                    temperature: 0.1,
                    response_format: { type: "json_object" }
                })
            });

            if (!response.ok) {
                const err = await response.text();
                throw new Error("OpenRouter API Error: " + err);
            }

            const data = await response.json();
            const textContent = data.choices[0].message.content;
            
            // Extract JSON array if model wrapped it in an object (due to json_object format)
            const parsed = JSON.parse(textContent);
            if (Array.isArray(parsed)) {
                return parsed;
            } else if (parsed.actions && Array.isArray(parsed.actions)) {
                return parsed.actions;
            } else {
                // Try to find an array in the keys
                for (const key of Object.keys(parsed)) {
                    if (Array.isArray(parsed[key])) return parsed[key];
                }
                throw new Error("Could not parse JSON array from OpenRouter response.");
            }
        }
    } catch (err: any) {
        console.error("AI Error:", err);
        throw new Error("Failed to process AI prompt. " + (err.message || "Invalid JSON or API failure."));
    }
}
