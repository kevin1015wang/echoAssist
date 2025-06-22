import React from 'react';
import { Message, MessageSender } from '../types';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUserRep = message.sender === MessageSender.USER_REPRESENTATIVE;
  const isAICaller = message.sender === MessageSender.AI_CALLER;
  const isSystem = message.sender === MessageSender.SYSTEM;

  let bubbleClasses = '';
  let timeClasses = '';
  let alignment = '';

  if (isUserRep) {
    bubbleClasses = 'bg-sky-500 text-white self-end rounded-l-xl rounded-tr-xl';
    timeClasses = 'text-sky-200';
    alignment = 'items-end';
  } else if (isAICaller) {
    bubbleClasses = 'bg-slate-200 text-slate-800 self-start rounded-r-xl rounded-tl-xl';
    timeClasses = 'text-slate-500';
    alignment = 'items-start';
  } else if (isSystem) {
    bubbleClasses = 'bg-amber-100 text-amber-700 self-center text-center italic border border-amber-300 rounded-md text-xs sm:text-sm w-full sm:w-auto max-w-full';
    timeClasses = 'text-amber-500';
    alignment = 'items-center'; // Center system messages
  }


  return (
    <div className={`flex flex-col ${alignment} group w-full`}>
      <div className={`max-w-xs md:max-w-md lg:max-w-lg p-3 shadow ${bubbleClasses} ${isSystem ? 'mx-auto my-1 px-4' : ''}`}>
        <p className={`text-sm whitespace-pre-wrap ${isSystem ? 'text-center' : ''}`}>{message.text}</p>
      </div>
      {!isSystem && (
        <span className={`text-xs mt-1 px-1 ${timeClasses} opacity-0 group-hover:opacity-100 transition-opacity`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
    </div>
  );
};
