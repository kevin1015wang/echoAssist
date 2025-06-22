import React, { useEffect, useRef } from 'react';
import { Message } from '../types';
import { MessageBubble } from './MessageBubble';
import { Button } from './Button';

interface ChatInterfaceProps {
  messages: Message[];
  isLoading: boolean; 
  onHangUp: () => void; 
  isListening: boolean;
  onMicTap: () => void;
  microphoneError: string | null;
  isSpeechRecognitionSupported: boolean;
  currentTranscript: string;
  canInteract: boolean; 
  maxUserMessagesReached: boolean;
  typedMessage: string;
  onTypedMessageChange: (text: string) => void;
  onSendTypedMessage: (text: string) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  isLoading,
  onHangUp,
  isListening,
  onMicTap,
  microphoneError,
  isSpeechRecognitionSupported,
  currentTranscript,
  canInteract,
  maxUserMessagesReached,
  typedMessage,
  onTypedMessageChange,
  onSendTypedMessage
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // Reset height
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`; // Set to scroll height
    }
  }, [typedMessage]);

  const handleSendClick = () => {
    if (typedMessage.trim()) {
      onSendTypedMessage(typedMessage.trim());
    }
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendClick();
    }
  };

  const getStatusAreaText = () => {
    if (isLoading && maxUserMessagesReached) return "AI is generating feedback...";
    if (isListening) return currentTranscript || "Listening...";
    if (currentTranscript && !isListening) return currentTranscript; // Show final transcript briefly
    if (!canInteract && !isListening && !isLoading) return "Waiting for AI caller...";
    return ""; // Empty when user can type or use mic
  };
  
  const statusAreaTextColor = () => {
    if (isLoading || !canInteract) return "text-slate-400";
    return "text-slate-800";
  };

  const micButtonDisabled = isLoading || !isSpeechRecognitionSupported || !canInteract;
  const sendButtonDisabled = isLoading || !canInteract || !typedMessage.trim();

  return (
    <div className="flex flex-col h-full bg-slate-50 rounded-b-lg">
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <MessageBubble key={index} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {microphoneError && (
        <div className="p-2 text-center bg-red-100 text-red-700 text-sm">
          {microphoneError}
        </div>
      )}

      <div className="p-3 border-t border-slate-200 bg-white space-y-2">
        <div 
          className={`w-full p-2 min-h-[24px] text-center text-sm ${statusAreaTextColor()}`}
          aria-live="polite"
        >
          {getStatusAreaText()}
        </div>
        <div className="flex items-end space-x-2">
          <textarea
            ref={textareaRef}
            value={typedMessage}
            onChange={(e) => onTypedMessageChange(e.target.value)}
            onKeyDown={handleTextareaKeyDown}
            placeholder={canInteract ? "Type your response..." : (isLoading ? "AI is responding..." : "Wait for AI...")}
            className="flex-grow p-2 border border-slate-300 rounded-lg resize-none overflow-y-auto max-h-24 focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
            rows={1}
            disabled={!canInteract || isLoading}
            aria-label="Your response input"
          />
          {isSpeechRecognitionSupported && (
            <Button 
              type="button" 
              onClick={onMicTap} 
              variant={isListening ? "danger" : "secondary"} 
              disabled={micButtonDisabled}
              aria-label={isListening ? "Stop listening" : "Start listening"}
              size="medium"
              className="p-2.5 h-[42px]" // Match approx height of textarea
            >
              {isListening ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M4.5 7.5a3 3 0 0 1 3-3h9a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3h-9a3 3 0 0 1-3-3v-9Z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15c-1.105 0-2-.895-2-2V7c0-1.105.895-2 2-2s2 .895 2 2v6c0 1.105-.895 2-2 2Z" />
                </svg>
              )}
            </Button>
          )}
          <Button
            type="button"
            onClick={handleSendClick}
            variant="primary"
            disabled={sendButtonDisabled}
            aria-label="Send typed message"
            size="medium"
            className="p-2.5 h-[42px]" // Match approx height of textarea
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
            </svg>
          </Button>
        </div>
         <Button 
            onClick={onHangUp} 
            variant="danger" 
            className="w-full mt-2" 
            size="medium" 
            disabled={isLoading && maxUserMessagesReached}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 3.75L18 6m0 0l2.25 2.25M18 6l-2.25 2.25m1.5-3.75V16.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 16.5V6.75a2.25 2.25 0 0 1 2.25-2.25h9Z" />
            </svg>
           {maxUserMessagesReached ? "View Feedback" : "End Scenario Early"}
        </Button>
      </div>
    </div>
  );
};