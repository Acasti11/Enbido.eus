import { useState, useRef, type FormEvent } from 'react';

interface UseGameChatProps {
  sendChatMessage: (msg: string) => void;
}

export const useGameChat = ({ sendChatMessage }: UseGameChatProps) => {
  const [activeTab, setActiveTab] = useState<'logs' | 'chat'>('logs');
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const handleSendChat = (e: FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendChatMessage(chatInput.trim());
    setChatInput('');
  };

  return { activeTab, setActiveTab, chatInput, setChatInput, chatEndRef, handleSendChat };
};
