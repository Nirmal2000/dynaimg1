'use client';

import { useState, useCallback } from 'react';
import { useToolContext } from '../contexts/ToolContext';

export default function SimpleChatInput() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { addToolByType } = useToolContext();

  // Handle chat message submission
  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = { role: 'user', content: inputValue.trim() };
    const updatedMessages = [...messages, userMessage];
    
    setMessages(updatedMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      // For demo: call local intent picker to choose a prebuilt tool.
      const response = await fetch('/api/pick-tool', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      if (!data.success) throw new Error('Failed to pick tool');

      // Update full message history from server (keeps tool-call context)
      if (Array.isArray(data.messages)) {
        setMessages(data.messages);
      }

      // Multi-tool support
      if (Array.isArray(data.selections) && data.selections.length) {
        for (const sel of data.selections) {
          if (sel?.tool) addToolByType(sel.tool, sel.props || {});
        }
      } else {
        // Back-compat for single selection shape
        const { tool, props } = data.selection || {};
        if (tool) addToolByType(tool, props);
      }
      
    } catch (error) {
      console.error('Chat error:', error);
      setMessages([...updatedMessages, { role: 'assistant', content: 'Sorry, I could not select a tool. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, messages]);

  // Handle Enter key press
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  return (
    <div className="w-full flex items-center space-x-2">
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyPress}
        placeholder="Generate a tool..."
        className="bg-transparent text-[#aeaeae] outline-none flex-1 text-lg font-mono resize-none"
        style={{
          wordWrap: "break-word",
          fontFamily: "var(--font-manrope), monospace"
        }}
        disabled={isLoading}
      />
      <button
        onClick={handleSendMessage}
        disabled={!inputValue.trim() || isLoading}
        className="text-[#aeaeae] hover:text-white transition-colors flex-shrink-0"
        title="Generate tool"
      >
        {isLoading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#aeaeae]"></div>
        ) : (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
        )}
      </button>
    </div>
  );
}
