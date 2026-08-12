import { NextRequest, NextResponse } from "next/server";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      jobTitle,
      jobSlug,
      questionNumber,
      totalQuestions,
      previousQuestions = [],
    } = body;

    if (!jobTitle) {
      return NextResponse.json(
        { error: "jobTitle is required" },
        { status: 400 }
      );
    }

    if (!questionNumber) {
      return NextResponse.json(
        { error: "questionNumber is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      console.error("GROQ_API_KEY is missing");

      return NextResponse.json(
        { error: "Groq API key is not configured" },
        { status: 500 }
      );
    }

    const previous = Array.isArray(previousQuestions)
      ? previousQuestions
      : [];

    const prompt = `
You are a professional AI interviewer.

Conduct a realistic job interview for this position:

Job Title: ${jobTitle}
Job Slug: ${jobSlug || "N/A"}

Current Question: ${questionNumber} of ${totalQuestions || 10}

Previous questions:
${previous.length > 0 ? previous.map((q: string) => `- ${q}`).join("\n") : "None"}

Generate ONLY the next interview question.

Requirements:
- Make it specific to the job position.
- Do not repeat previous questions.
- Make it realistic like a human interviewer.
- Questions should progressively become more relevant and challenging.
- Keep the question concise.
- Do not include numbering.
- Do not include explanations.
- Do not include quotation marks.
- Return ONLY the question text.
`;

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content:
              "You are an expert professional interviewer. Return only the interview question.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 200,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Groq API error:", data);

      return NextResponse.json(
        {
          error: "Groq API request failed",
          details: data?.error?.message || "Unknown Groq error",
        },
        { status: 500 }
      );
    }

    const question = data?.choices?.[0]?.message?.content?.trim();

    if (!question) {
      return NextResponse.json(
        { error: "Groq returned an empty question" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      question,
      questionNumber,
    });
  } catch (error) {
    console.error("Question API error:", error);

    return NextResponse.json(
      {
        error: "Failed to generate question",
      },
      { status: 500 }
    );
  }
}