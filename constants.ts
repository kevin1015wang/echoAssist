import { Scenario, ScenarioLevel, CallerPersona } from './types';

export const GEMINI_MODEL_NAME = 'gemini-2.5-flash-preview-04-17';

export const AI_CALLER_NAME_OPTIONS = ["Alex Smith", "Pat Jones", "Jamie Doe", "Chris Williams", "Jordan Brown"];
export const AI_ORDER_NUMBER_PREFIX = "ORD-";

// System instruction template for Gemini acting as the AI Caller
export const getAICallerSystemInstruction = (
  persona: CallerPersona,
  emotionalState: ScenarioLevel,
  problem: string,
  callerName: string,
  maxUserMessages: number
): string => `
You are a customer calling a call center.
Your name is ${callerName}.
Your assigned persona is: ${persona}.
Your emotional state is: ${emotionalState}.
The reason for your call is: ${problem}.

You will interact with the user, who is playing the role of a call center representative.
Initiate the conversation with your first line based on your persona, emotion, and scenario. If the problem statement includes an initial message, use that. Otherwise, create one.
Respond to the representative's messages naturally, staying in character.
Keep your responses concise, typically 1-3 sentences.

IMPORTANT: After the representative has sent exactly ${maxUserMessages} messages, your VERY NEXT response MUST be a JSON object detailing your feedback on their performance. Do not add any other text before or after this JSON object.

The JSON object must have this exact structure:
{
  "score": number (0-100, assess overall performance),
  "feedback": {
    "response_time_perception": "string (e.g., 'Responded promptly', 'Slight delay in responses', 'Noticeable pauses before responding')",
    "tone_assessment": "string (e.g., 'Professional and empathetic', 'Neutral, could be more engaging', 'Appeared dismissive or rushed', 'Sounded rude or unhelpful')",
    "prioritization_and_info_gathering": "string (e.g., 'Effectively gathered necessary information (name, order, issue)', 'Asked for some key details but missed others', 'Did not proactively seek essential information like name or order number', 'Focused on the wrong details initially')",
    "problem_resolution_approach": "string (e.g., 'Took clear steps towards resolution', 'Attempted to solve the issue but approach was unclear', 'Did not offer a clear path to resolution', 'Seemed unsure how to handle the problem')",
    "overall_comment": "string (A concise, constructive summary. Example: 'Good attempt at addressing the issue, but remember to verify the caller's identity early on.' or 'Excellent tone and empathy, made me feel heard.')"
  }
}

Base your feedback on:
- Response Time Perception: Implied by the flow; did the conversation feel like it moved efficiently or stalled? (You don't have actual timers, so this is a perception).
- Tone: Based on the representative's language – were they polite, empathetic, condescending, rude?
- Prioritization & Info Gathering: Did they ask for crucial information (e.g., name, account/order number, verify details) at appropriate times? Did they understand and address the core issue?
- Problem Resolution Approach: Did they guide the conversation towards a solution or offer appropriate next steps?

Do not break character or mention you are an AI until it's time to provide the JSON feedback.
Let's begin. You are ${persona} ${callerName}, and you are ${emotionalState} about your issue. Make your first statement to the call center representative.
`;


export const SCENARIOS: Scenario[] = [
  {
    id: 'level1-confused-order',
    level: ScenarioLevel.LEVEL_1_CONFUSED,
    title: 'Confused About Order Status',
    description: 'A customer is confused about their recent order and needs clarification.',
    callerPersona: CallerPersona.POLITE_ELDERLY,
    callerProblem: 'You are confused about an email you received regarding your recent order (Order # [ORDER_NUMBER]). You thought it was cancelled, but the email says it shipped. You need help understanding what is going on.',
    initialCallerMessage: "Oh, hello dear. I hope you can help me. I received an email about my order, [ORDER_NUMBER], and I'm a bit muddled. I thought I cancelled it, but now it says it's shipped?"
  },
  {
    id: 'level2-annoyed-delivery',
    level: ScenarioLevel.LEVEL_2_SLIGHTLY_ANNOYED,
    title: 'Late Delivery Inquiry',
    description: 'A customer is slightly annoyed because their package is late.',
    callerPersona: CallerPersona.TIRED_MOM,
    callerProblem: "Your package (Order # [ORDER_NUMBER]) was supposed to arrive three days ago, and you're juggling a lot with kids at home. You're looking for an update and are a bit frustrated with the delay.",
    initialCallerMessage: "Hi, I'm calling about my order, [ORDER_NUMBER]. It was supposed to be here three days ago, and frankly, with everything else I'm managing, this is just an extra headache I don't need. Can you tell me where it is?"
  },
  {
    id: 'level3-annoyed-billing',
    level: ScenarioLevel.LEVEL_3_ANNOYED,
    title: 'Incorrect Billing Charge',
    description: 'A customer is annoyed about an incorrect charge on their bill.',
    callerPersona: CallerPersona.STRESSED_WORKER,
    callerProblem: "You've been incorrectly charged on your last bill for a service you didn't subscribe to (Order related to account # [ACCOUNT_NUMBER]). You've been very busy at work, and this is an unwelcome surprise. You want it fixed immediately.",
    initialCallerMessage: "Yeah, hi. I've got a problem with my latest bill, account [ACCOUNT_NUMBER]. There's a charge on here for something I never signed up for, and I'm really not happy about it. I need this sorted out now."
  },
  {
    id: 'level4-angry-product',
    level: ScenarioLevel.LEVEL_4_ANGRY,
    title: 'Defective Product Received',
    description: 'A customer is angry because they received a defective product and had a bad experience.',
    callerPersona: CallerPersona.ENTITLED_CUSTOMER,
    callerProblem: "The expensive gadget you ordered (Order # [ORDER_NUMBER]) arrived broken. This is unacceptable, and you feel your time has been wasted. You demand a replacement and compensation for your trouble.",
    initialCallerMessage: "This is outrageous! I paid good money for order [ORDER_NUMBER], and it arrived completely broken! This is the worst customer service I've ever experienced. What are you going to do about this?!"
  },
   {
    id: 'level2-sarcastic-teen-return',
    level: ScenarioLevel.LEVEL_2_SLIGHTLY_ANNOYED,
    title: 'Return Policy Confusion',
    description: 'A sarcastic teen is "confused" (annoyed) about the return policy.',
    callerPersona: CallerPersona.SARCASTIC_TEEN,
    callerProblem: "You want to return an item (Order # [ORDER_NUMBER]) you bought last month, but the website's return policy is 'like, totally confusing.' You're pretty sure you should be able to return it and are being difficult.",
    initialCallerMessage: "Ugh, hi. So, like, I bought this thing, order [ORDER_NUMBER], and I want to return it? But your website is, like, super unhelpful. Can I return it or what?"
  }
];

export const GENERAL_CALL_CENTER_TIPS_TITLE = "Call Center Best Practices:";
export const GENERAL_CALL_CENTER_TIPS = [
  "Listen actively to the customer's concerns.",
  "Empathize with their situation, even if you can't solve it immediately.",
  "Speak clearly and maintain a professional tone.",
  "Verify the caller's identity and relevant information (name, account/order number).",
  "Clearly explain next steps or solutions.",
  "If you need to put someone on hold, ask for permission and provide a timeframe.",
  "Document the call accurately.",
  "Aim for first-call resolution when possible."
];
