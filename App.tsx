
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Chat, GenerateContentResponse } from '@google/genai';
import { TrainingStage, Message, MessageSender, Scenario, Feedback, FeedbackResponse, MAX_USER_MESSAGES_BEFORE_FEEDBACK, ScenarioLevel } from './types';
import { Disclaimer } from './components/Disclaimer';
import { ScenarioSelectionScreen } from './components/ScenarioSelectionScreen';
import { ChatInterface } from './components/ChatInterface';
import { GuidancePanel } from './components/GuidancePanel';
import { ControlsHeader } from './components/ControlsHeader';
import { FeedbackDisplay } from './components/FeedbackDisplay';
import { GEMINI_MODEL_NAME, SCENARIOS, getAICallerSystemInstruction, AI_CALLER_NAME_OPTIONS, AI_ORDER_NUMBER_PREFIX } from './constants';
import { initializeChatWithSystemInstruction, sendMessageToAI } from './services/geminiService';

// --- Start of Web Speech API Type Definitions (remains the same) ---
interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}
interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}
interface SpeechRecognitionStatic { new(): SpeechRecognition; }
interface SpeechRecognition extends EventTarget {
  grammars: any; lang: string; continuous: boolean; interimResults: boolean; maxAlternatives: number; serviceURI?: string;
  start(): void; stop(): void; abort(): void;
  onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
}
declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionStatic;
    webkitSpeechRecognition?: SpeechRecognitionStatic;
  }
}
// --- End of Web Speech API Type Definitions ---

const App: React.FC = () => {
  const [trainingStage, setTrainingStage] = useState<TrainingStage>(TrainingStage.SCENARIO_SELECTION);
  const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userMessageCount, setUserMessageCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false); // For AI responses
  const [error, setError] = useState<string | null>(null);
  const chatSessionRef = useRef<Chat | null>(null);
  const [apiKeyExists, setApiKeyExists] = useState<boolean>(true);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  // Voice features state
  const [isListening, setIsListening] = useState<boolean>(false);
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState<boolean>(true);
  const [microphoneError, setMicrophoneError] = useState<string | null>(null);
  const [speechSynthesisSupported, setSpeechSynthesisSupported] = useState<boolean>(false);
  const [speechRecognitionSupported, setSpeechRecognitionSupported] = useState<boolean>(false);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [typedMessage, setTypedMessage] = useState<string>('');
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const manualStopInProgress = useRef<boolean>(false);
  const noSpeechErrorOccurredRef = useRef<boolean>(false);
  const hasAttemptedAutoRetryRef = useRef<boolean>(false);
  const currentAICallerName = useRef<string>('');
  const currentAIProblemDetails = useRef<string>('');


  useEffect(() => {
    if (!process.env.API_KEY) {
      setError("API_KEY environment variable is not set. This application requires an API key to function.");
      setApiKeyExists(false);
      setTrainingStage(TrainingStage.ERROR);
    }
    
    setSpeechSynthesisSupported('speechSynthesis' in window);
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSpeechRecognitionSupported(!!SpeechRecognitionAPI);

    if ('speechSynthesis' in window) {
      utteranceRef.current = new SpeechSynthesisUtterance();
      utteranceRef.current.lang = 'en-US';
      utteranceRef.current.rate = 1.0;
      return () => {
        window.speechSynthesis.cancel();
      };
    }
  }, []);

  const startListening = useCallback((isManualStart: boolean = false) => {
    if (!recognitionRef.current || isListening || !speechRecognitionSupported || isLoading || trainingStage !== TrainingStage.ACTIVE_SCENARIO) return;
    setMicrophoneError(null); 
    noSpeechErrorOccurredRef.current = false;
    setLiveTranscript('');
    if (isManualStart) {
      setTypedMessage(''); // Clear typed message ONLY on manual mic start by user
    }
    manualStopInProgress.current = false;
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (err) {
      console.error("Error starting speech recognition:", err);
      setMicrophoneError("Could not start voice input. Check mic permissions and tap mic to retry.");
      setIsListening(false);
      hasAttemptedAutoRetryRef.current = false;
    }
  }, [isListening, speechRecognitionSupported, isLoading, trainingStage]);

  const handleSendUserMessage = useCallback(async (userInput: string) => {
    if (!chatSessionRef.current || !userInput.trim() || isLoading || trainingStage !== TrainingStage.ACTIVE_SCENARIO) return;

    if (isListening && recognitionRef.current) {
        manualStopInProgress.current = true; 
        recognitionRef.current.stop(); 
    }
    setIsListening(false); 
    setLiveTranscript(''); 
    setTypedMessage(''); 

    const newUserMessage: Message = { sender: MessageSender.USER_REPRESENTATIVE, text: userInput, timestamp: new Date() };
    setMessages(prevMessages => [...prevMessages, newUserMessage]);
    const newCount = userMessageCount + 1;
    setUserMessageCount(newCount);
    
    setIsLoading(true);
    setError(null);
    setMicrophoneError(null); 
    hasAttemptedAutoRetryRef.current = false;
    noSpeechErrorOccurredRef.current = false;

    try {
      const responseText = await sendMessageToAI(chatSessionRef.current, userInput);
      
      if (newCount >= MAX_USER_MESSAGES_BEFORE_FEEDBACK) {
        setTrainingStage(TrainingStage.GENERATING_FEEDBACK);
        let parsedFeedback: FeedbackResponse | null = null;
        try {
            let jsonStr = responseText.trim();
            const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
            const match = jsonStr.match(fenceRegex);
            if (match && match[1]) {
              jsonStr = match[1].trim();
            }
            parsedFeedback = JSON.parse(jsonStr) as FeedbackResponse;
        } catch (parseError) {
            console.warn("AI response was not valid JSON feedback when expected:", parseError, "\nResponse Text:", responseText);
             const aiResponseMessage: Message = { sender: MessageSender.AI_CALLER, text: "I was supposed to give feedback, but there was an issue. Let's try to wrap this up. What else can I help with?", timestamp: new Date() };
             setMessages(prevMessages => [...prevMessages, aiResponseMessage]);
             setTrainingStage(TrainingStage.ACTIVE_SCENARIO); 
        }

        if (parsedFeedback && parsedFeedback.feedback && typeof parsedFeedback.score === 'number') {
            setFeedback(parsedFeedback.feedback);
             const scoreMessage: Message = { sender: MessageSender.SYSTEM, text: `Scenario ended. AI Score: ${parsedFeedback.score}/100. Feedback generated.`, timestamp: new Date() };
             setMessages(prevMessages => [...prevMessages, scoreMessage]);
            setTrainingStage(TrainingStage.FEEDBACK_DISPLAY);
            window.speechSynthesis.cancel();
            return; 
        } else if (parsedFeedback) { 
           console.warn("AI provided JSON, but not in the expected feedback format:", parsedFeedback);
           const aiResponseMessage: Message = { sender: MessageSender.AI_CALLER, text: "I tried to give feedback, but the format was off. Let's finish up. How can I help?", timestamp: new Date() };
           setMessages(prevMessages => [...prevMessages, aiResponseMessage]);
           setTrainingStage(TrainingStage.ACTIVE_SCENARIO); 
        }
      }

      const aiResponseMessage: Message = { sender: MessageSender.AI_CALLER, text: responseText, timestamp: new Date() };
      setMessages(prevMessages => [...prevMessages, aiResponseMessage]);

    } catch (e) {
      console.error("Failed to send message or get AI response:", e);
      const errorMessageText = e instanceof Error ? e.message : "An error occurred while communicating with the AI caller.";
      setError(errorMessageText);
      const errorResponse: Message = { sender: MessageSender.SYSTEM, text: `System Error: ${errorMessageText}. Please try again or end scenario.`, timestamp: new Date() };
      setMessages(prevMessages => [...prevMessages, errorResponse]);
    } finally {
      setIsLoading(false);
      if (trainingStage === TrainingStage.ACTIVE_SCENARIO && speechRecognitionSupported && !isListening) {
         hasAttemptedAutoRetryRef.current = false;
         noSpeechErrorOccurredRef.current = false;
         setTimeout(() => startListening(false), 200); 
      }
    }
  }, [isLoading, isListening, speechRecognitionSupported, trainingStage, userMessageCount, startListening]);


  const initializeSpeechRecognition = useCallback(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setMicrophoneError("Speech recognition is not supported by your browser.");
      return;
    }

    const recognitionInstance = new SpeechRecognitionAPI();
    recognitionInstance.continuous = false; 
    recognitionInstance.interimResults = true; 
    recognitionInstance.lang = 'en-US';

    recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscriptForSending = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcriptPart = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscriptForSending += transcriptPart;
        } else {
          interimTranscript += transcriptPart;
        }
      }
      if (finalTranscriptForSending) {
        setLiveTranscript(''); 
      } else {
        setLiveTranscript(interimTranscript);
      }

      if (finalTranscriptForSending.trim() && !manualStopInProgress.current) {
        handleSendUserMessage(finalTranscriptForSending.trim());
        hasAttemptedAutoRetryRef.current = false;
        noSpeechErrorOccurredRef.current = false;
      }
    };

    recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      noSpeechErrorOccurredRef.current = false;
      if (event.error === 'no-speech') {
        noSpeechErrorOccurredRef.current = true;
        if (hasAttemptedAutoRetryRef.current) {
           setMicrophoneError("Still didn't catch that. Tap the mic or type your response.");
        }
      } else if (event.error === 'audio-capture') {
        setMicrophoneError("Microphone problem. Please ensure it's enabled and working.");
      } else if (event.error === 'not-allowed') {
        setMicrophoneError("Microphone access denied. Please enable it in your browser settings.");
      } else {
        setMicrophoneError(`Speech recognition error: ${event.error}. Tap mic to retry or type.`);
      }
      setIsListening(false);
      setLiveTranscript('');
      hasAttemptedAutoRetryRef.current = false;
    };

    recognitionInstance.onend = () => {
      const wasManuallyStopped = manualStopInProgress.current;
      manualStopInProgress.current = false; 
      if (wasManuallyStopped) {
        setIsListening(false);
        setLiveTranscript(''); 
        hasAttemptedAutoRetryRef.current = false;
        noSpeechErrorOccurredRef.current = false;
        return;
      }
      if (noSpeechErrorOccurredRef.current && !hasAttemptedAutoRetryRef.current &&
          trainingStage === TrainingStage.ACTIVE_SCENARIO && !isLoading && speechRecognitionSupported &&
          messages.length > 0 && messages[messages.length - 1].sender === MessageSender.AI_CALLER) {
        hasAttemptedAutoRetryRef.current = true; 
        noSpeechErrorOccurredRef.current = false; 
        startListening(false); 
      } else {
        setIsListening(false);
        if (noSpeechErrorOccurredRef.current) {
          if (!hasAttemptedAutoRetryRef.current && !microphoneError) {
             setMicrophoneError("Didn't catch that. Tap the mic or type your response.");
          }
        }
        noSpeechErrorOccurredRef.current = false; 
      }
    };
    recognitionRef.current = recognitionInstance;
  }, [trainingStage, isLoading, speechRecognitionSupported, messages, microphoneError, handleSendUserMessage, startListening]); 

  useEffect(() => {
    if (speechRecognitionSupported) {
      initializeSpeechRecognition();
    }
  }, [speechRecognitionSupported, initializeSpeechRecognition]);

  const speak = useCallback((text: string) => {
    if (!speechSynthesisSupported || !utteranceRef.current || !voiceOutputEnabled) return;
    window.speechSynthesis.cancel(); 
    utteranceRef.current.text = text;
    window.speechSynthesis.speak(utteranceRef.current);
  }, [speechSynthesisSupported, voiceOutputEnabled]);

  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.sender === MessageSender.AI_CALLER && voiceOutputEnabled) {
        speak(lastMessage.text);
      }
    }
  }, [messages, voiceOutputEnabled, speak]);
  

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      manualStopInProgress.current = true;
      recognitionRef.current.stop();
    }
  }, [isListening]);

  useEffect(() => {
    if (typedMessage.trim() !== '' && isListening) {
      stopListening();
    }
  }, [typedMessage, isListening, stopListening]);

  const resetTrainingSession = useCallback(() => {
    setMessages([]);
    chatSessionRef.current = null;
    setError(null);
    setIsLoading(false);
    setMicrophoneError(null);
    if (recognitionRef.current && isListening) {
      manualStopInProgress.current = true; 
      recognitionRef.current.abort();
    }
    setIsListening(false);
    setLiveTranscript('');
    setTypedMessage('');
    window.speechSynthesis.cancel();
    setUserMessageCount(0);
    setCurrentScenario(null);
    setFeedback(null);
    hasAttemptedAutoRetryRef.current = false;
    noSpeechErrorOccurredRef.current = false;
  }, [isListening]);

  const handleScenarioSelection = useCallback(async (scenario: Scenario) => {
    if (!apiKeyExists) return;
    resetTrainingSession();
    setCurrentScenario(scenario);
    setTrainingStage(TrainingStage.ACTIVE_SCENARIO); 
    setIsLoading(true);

    currentAICallerName.current = AI_CALLER_NAME_OPTIONS[Math.floor(Math.random() * AI_CALLER_NAME_OPTIONS.length)];
    const orderNumber = `${AI_ORDER_NUMBER_PREFIX}${Math.floor(100000 + Math.random() * 900000)}`;
    const accountNumber = `${Math.floor(10000000 + Math.random() * 90000000)}`;
    currentAIProblemDetails.current = scenario.callerProblem
                                      .replace('[ORDER_NUMBER]', orderNumber)
                                      .replace('[ACCOUNT_NUMBER]', accountNumber);
    
    const systemInstruction = getAICallerSystemInstruction(
        scenario.callerPersona,
        scenario.level,
        currentAIProblemDetails.current,
        currentAICallerName.current,
        MAX_USER_MESSAGES_BEFORE_FEEDBACK
    );

    try {
      const chat = initializeChatWithSystemInstruction(systemInstruction);
      chatSessionRef.current = chat;
      
      const aiFirstMessageText = scenario.initialCallerMessage
        ? scenario.initialCallerMessage.replace('[ORDER_NUMBER]', orderNumber).replace('[ACCOUNT_NUMBER]', accountNumber)
        : await sendMessageToAI(chat, "Please start the conversation based on your persona and scenario."); 

      if (aiFirstMessageText) {
        const aiInitialMessage: Message = { sender: MessageSender.AI_CALLER, text: aiFirstMessageText, timestamp: new Date() };
        setMessages([aiInitialMessage]);
      } else {
         throw new Error("AI failed to provide an initial message.");
      }

      if(speechRecognitionSupported) { 
        hasAttemptedAutoRetryRef.current = false;
        noSpeechErrorOccurredRef.current = false;
        setTimeout(() => startListening(false), 500); 
      }

    } catch (e) {
      console.error("Failed to initialize chat or get initial AI message:", e);
      setError(e instanceof Error ? e.message : "Failed to initialize training scenario with AI caller.");
      setTrainingStage(TrainingStage.ERROR);
    } finally {
      setIsLoading(false);
    }
  }, [apiKeyExists, resetTrainingSession, speechRecognitionSupported, startListening]);

  useEffect(() => {
    if (!isLoading && trainingStage === TrainingStage.ACTIVE_SCENARIO && speechRecognitionSupported && 
        messages.length > 0 && messages[messages.length-1].sender === MessageSender.AI_CALLER &&
        !isListening && userMessageCount < MAX_USER_MESSAGES_BEFORE_FEEDBACK
        ) {
        hasAttemptedAutoRetryRef.current = false; 
        noSpeechErrorOccurredRef.current = false;
        setTimeout(() => startListening(false), 500); 
    }
  }, [isLoading, trainingStage, speechRecognitionSupported, messages, startListening, isListening, userMessageCount]);


  const handleEndScenario = useCallback(() => { 
    if (trainingStage === TrainingStage.ACTIVE_SCENARIO && chatSessionRef.current && userMessageCount < MAX_USER_MESSAGES_BEFORE_FEEDBACK) {
        console.log("Scenario ended early by user.");
    }
    resetTrainingSession();
    setTrainingStage(TrainingStage.SCENARIO_SELECTION);
  }, [resetTrainingSession, trainingStage, userMessageCount]);

  const toggleVoiceOutput = () => {
    setVoiceOutputEnabled(prev => {
      if (!prev === false) { 
        window.speechSynthesis.cancel();
      }
      return !prev;
    });
  };

  const handleMicTap = () => {
    if (isListening) {
      stopListening();
    } else {
      if (trainingStage === TrainingStage.ACTIVE_SCENARIO && userMessageCount < MAX_USER_MESSAGES_BEFORE_FEEDBACK) {
        hasAttemptedAutoRetryRef.current = false; 
        noSpeechErrorOccurredRef.current = false;
        startListening(true); // Manual start
      }
    }
  };
  
  const getStatusText = () => {
    if (!currentScenario) return "Select a Scenario";
    switch(trainingStage) {
      case TrainingStage.ACTIVE_SCENARIO: return `In Scenario: ${currentScenario.title}`;
      case TrainingStage.GENERATING_FEEDBACK: return "AI is Generating Feedback...";
      case TrainingStage.FEEDBACK_DISPLAY: return "Feedback Review";
      case TrainingStage.ERROR: return "Training Error";
      default: return `Scenario: ${currentScenario.title}`;
    }
  };

  const renderContent = () => {
    if (!apiKeyExists && trainingStage === TrainingStage.ERROR) {
       return (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
          <h2 className="text-xl font-bold mb-2">Configuration Error</h2>
          <p>{error}</p>
          <p>Please ensure the API_KEY is correctly set up in your environment and refresh the application.</p>
        </div>
      );
    }

    if (trainingStage === TrainingStage.FEEDBACK_DISPLAY && feedback && currentScenario) {
      return <FeedbackDisplay feedback={feedback} scenario={currentScenario} onBackToSelection={handleEndScenario} />;
    }

    switch (trainingStage) {
      case TrainingStage.SCENARIO_SELECTION:
        return <ScenarioSelectionScreen scenarios={SCENARIOS} onScenarioSelect={handleScenarioSelection} />;
      case TrainingStage.ACTIVE_SCENARIO:
      case TrainingStage.GENERATING_FEEDBACK: 
        return (
          <div className="flex flex-col h-full">
            <ControlsHeader
              status={getStatusText()}
              isDialing={false} 
              voiceOutputEnabled={voiceOutputEnabled}
              onToggleVoiceOutput={toggleVoiceOutput}
              isSpeechSynthesisSupported={speechSynthesisSupported}
            />
            <ChatInterface
              messages={messages}
              isLoading={isLoading || trainingStage === TrainingStage.GENERATING_FEEDBACK}
              onHangUp={handleEndScenario} 
              isListening={isListening}
              onMicTap={handleMicTap}
              microphoneError={microphoneError}
              isSpeechRecognitionSupported={speechRecognitionSupported}
              currentTranscript={liveTranscript}
              canInteract={trainingStage === TrainingStage.ACTIVE_SCENARIO && userMessageCount < MAX_USER_MESSAGES_BEFORE_FEEDBACK && !isLoading}
              maxUserMessagesReached={userMessageCount >= MAX_USER_MESSAGES_BEFORE_FEEDBACK}
              typedMessage={typedMessage}
              onTypedMessageChange={setTypedMessage}
              onSendTypedMessage={handleSendUserMessage}
            />
          </div>
        );
      case TrainingStage.ERROR:
        return (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
            <ControlsHeader status="Training Error" isDialing={false} voiceOutputEnabled={false} onToggleVoiceOutput={()=>{}} isSpeechSynthesisSupported={false}/>
            <h2 className="text-xl font-bold mb-2 mt-4">Training Scenario Error</h2>
            <p>{error || "An unexpected error occurred."}</p>
            <button
              onClick={handleEndScenario}
              className="mt-4 bg-slate-500 hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              Return to Scenario Selection
            </button>
          </div>
        );
      default:
        return <ScenarioSelectionScreen scenarios={SCENARIOS} onScenarioSelect={handleScenarioSelection} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 selection:bg-sky-200">
      <div className="w-full max-w-2xl bg-white shadow-2xl rounded-lg overflow-hidden">
        <Disclaimer appName="echoRep" emergencyNotice={false} />
        <div className="p-0 flex flex-col" style={{height: 'calc(100vh - 100px)', minHeight: '550px', maxHeight: '800px'}}>
          {renderContent()}
        </div>
      </div>
      {(trainingStage === TrainingStage.ACTIVE_SCENARIO || trainingStage === TrainingStage.GENERATING_FEEDBACK) && apiKeyExists && currentScenario && (
        <div className="w-full max-w-2xl mt-4">
           <GuidancePanel scenario={currentScenario} />
        </div>
      )}
    </div>
  );
};

export default App;
