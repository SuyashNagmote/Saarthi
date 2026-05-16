import { z } from 'zod';

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

export async function generateGoal(data: any) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    // Demo fallback if no key is provided
    return {
      description: `Successfully increase ${data.title.toLowerCase()} by optimizing current workflows and implementing new best practices across the department.`,
      uom_type: 'NUMERIC',
      goal_type: 'MAX_TYPE',
      target_value: 1200000,
      target_display: '₹12,00,000',
      weightage_suggestion: 20,
      thrust_area: 'Growth',
      category: 'Strategic',
      rationale: 'Based on historical trends and current quarter projections.'
    };
  }

  const prompt = `You are an enterprise performance management expert for Indian tech companies. Generate a professional SMART goal.
Return ONLY valid JSON with this exact structure:
{
  "description": "2-3 sentences, professional",
  "uom_type": "NUMERIC" | "PERCENTAGE" | "TIMELINE" | "ZERO_BASED",
  "goal_type": "MIN_TYPE" | "MAX_TYPE" | "TIMELINE" | "ZERO_BASED",
  "target_value": number,
  "target_display": "string e.g. ₹12,00,000 or 90%",
  "weightage_suggestion": number (10-50, considering existing goals),
  "thrust_area": "string (short 1-2 words)",
  "category": "Strategic" | "Operational" | "Development",
  "rationale": "short explanation of why this target"
}

Inputs:
Title: ${data.title}
Department: ${data.department}
Designation: ${data.designation}
Cycle: ${data.cycle_name}
Existing Goals: ${JSON.stringify(data.existing_goals)}`;

  const response = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: prompt }],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    console.error('OpenAI Error', await response.text());
    throw new Error('AI generation failed');
  }

  const result: any = await response.json();
  return JSON.parse(result.choices[0].message.content);
}

export async function parseCheckin(data: any) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return {
      actual_achievement: data.goal.target_value * 0.9,
      achievement_display: `₹${(data.goal.target_value * 0.9).toLocaleString()}`,
      goal_status: 'ON_TRACK',
      self_rating: 4,
      progress_notes: data.nl_input,
      confidence: 'MEDIUM',
      explanation: 'Fallback mode without OpenAI key.',
    };
  }

  const prompt = `Extract check-in data from the user's natural language input.
Return ONLY valid JSON with this exact structure:
{
  "actual_achievement": number or null,
  "achievement_display": "string formatted cleanly",
  "goal_status": "NOT_STARTED" | "ON_TRACK" | "AT_RISK" | "COMPLETED" | "MISSED",
  "self_rating": number (1-5) or null,
  "progress_notes": "cleaned up version of the input notes",
  "confidence": "HIGH" | "MEDIUM" | "LOW",
  "explanation": "short explanation of what was extracted"
}

Goal Context:
Title: ${data.goal.title}
Target: ${data.goal.target_value}
UoM: ${data.goal.uom_type}

User Input: "${data.nl_input}"`;

  const response = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: prompt }],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    console.error('OpenAI Error', await response.text());
    throw new Error('AI parsing failed');
  }

  const result: any = await response.json();
  return JSON.parse(result.choices[0].message.content);
}
