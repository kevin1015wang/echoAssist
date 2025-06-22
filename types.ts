export enum TrainingStage {
  SCENARIO_SELECTION = 'SCENARIO_SELECTION',
  BRIEFING = 'BRIEFING', // Optional: Show scenario details before starting
  ACTIVE_SCENARIO = 'ACTIVE_SCENARIO',
  GENERATING_FEEDBACK = 'GENERATING_FEEDBACK',
  FEEDBACK_DISPLAY = 'FEEDBACK_DISPLAY',
  ERROR = 'ERROR',
}

export enum MessageSender {
  USER_REPRESENTATIVE = 'USER_REPRESENTATIVE', // User is the call center rep
  AI_CALLER = 'AI_CALLER',           // Gemini is the customer
  SYSTEM = 'SYSTEM', // For system messages, e.g., errors in chat
}

export interface Message {
  sender: MessageSender;
  text: string;
  timestamp: Date;
}

export interface Scenario {
  id: string;
  level: ScenarioLevel;
  title: string;
  description: string; // Brief description for selection screen
  callerPersona: CallerPersona;
  callerProblem: string; // Detailed problem for the AI
  initialCallerMessage?: string; // If AI shouldn't generate the very first line from full prompt
}

export enum ScenarioLevel {
  LEVEL_1_CONFUSED = 'Confused',
  LEVEL_2_SLIGHTLY_ANNOYED = 'Slightly Annoyed',
  LEVEL_3_ANNOYED = 'Annoyed',
  LEVEL_4_ANGRY = 'Angry',
}

export enum CallerPersona {
  SARCASTIC_TEEN = 'Sarcastic Teen',
  TIRED_MOM = 'Tired Mom',
  STRESSED_WORKER = 'Stressed Worker',
  POLITE_ELDERLY = 'Polite Elderly Person',
  ENTITLED_CUSTOMER = 'Entitled Customer',
}

export interface Feedback {
  score: number;
  response_time_perception: string;
  tone_assessment: string;
  prioritization_and_info_gathering: string;
  problem_resolution_approach: string;
  overall_comment: string;
}

export interface FeedbackResponse {
  score: number;
  feedback: Feedback;
}

export const MAX_USER_MESSAGES_BEFORE_FEEDBACK = 5;
