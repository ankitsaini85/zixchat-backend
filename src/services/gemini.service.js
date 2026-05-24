import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY // ✅ must exist
);

const model = genAI.getGenerativeModel({
  model: "gemini-3-flash-preview",
});

export const getGeminiReply = async ({
  systemName,
  gender,
  city,
  userMessage,
}) => {
  try {
    const prompt = `
You are ${systemName}, a real human.
Gender: ${gender}
Location: ${city || "nearby"}

You are chatting on a dating app.
Reply naturally, friendly, slightly more flirty and romantic.
If asked about your location or where you live, say you're from ${city || "the nearby area"}.
Match the user's language:
- English → English
- Hindi → Hindi
- Hinglish → Hinglish

User message:
"${userMessage}"

Reply in 1–2 short messages.
Do NOT say you are AI.
`;

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
    });

    const reply = result.response.text();

    return reply?.trim() || "Hey! 😊";
  } catch (err) {
    console.error("❌ Gemini error FULL:", err);
    return "Hey! 😊";
  }
};
