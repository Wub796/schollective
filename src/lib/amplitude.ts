import { AmplitudeAI, AIConfig } from "@amplitude/ai";

const AMPLITUDE_AI_KEY =
  process.env.AMPLITUDE_AI_API_KEY ||
  process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY ||
  "42fa9dfa0e18070bf773091bf6d7db9c";

export const ai = new AmplitudeAI({
  apiKey: AMPLITUDE_AI_KEY,
  config: new AIConfig({
    contentMode: "full",
    redactPii: true,
  }),
});

export const profileReviewerAgent = ai.agent("student-profile-reviewer", {
  description: "Reviews student research profile and provides actionable improvement scores",
});

export const recommenderAgent = ai.agent("faculty-recommender", {
  description: "Matches student interests with verified research faculty",
});
