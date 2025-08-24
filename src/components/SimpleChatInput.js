'use client';

import { useState, useCallback } from 'react';
import { useToolContext } from '../contexts/ToolContext';

export default function SimpleChatInput() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { addTool } = useToolContext();

  // Extract code blocks from message content
  const extractCodeBlocks = useCallback((content) => {
    const codeBlockRegex = /```(?:html|javascript|js|css)?\n?([\s\S]*?)```/g;
    const blocks = [];
    let match;
    
    while ((match = codeBlockRegex.exec(content)) !== null) {
      blocks.push({
        code: match[1].trim(),
        fullMatch: match[0]
      });
    }
    
    return blocks;
  }, []);

  // Find largest code block by character count
  const findLargestCodeBlock = useCallback((codeBlocks) => {
    if (codeBlocks.length === 0) return null;
    
    return codeBlocks.reduce((largest, current) => 
      current.code.length > largest.code.length ? current : largest
    );
  }, []);

  // Auto-render the largest code block
  const autoRenderLargestBlock = useCallback((content) => {
    const codeBlocks = extractCodeBlocks(content);
    const largestBlock = findLargestCodeBlock(codeBlocks);
    
    if (largestBlock) {
      const toolId = `auto-${Date.now()}`;
      // Use React context instead of global events
      addTool(largestBlock.code, toolId);
    }
  }, [addTool, extractCodeBlocks, findLargestCodeBlock]);

  // Handle chat message submission
  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = { role: 'user', content: inputValue.trim() };
    const updatedMessages = [...messages, userMessage];
    
    setMessages(updatedMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/generate-tool', {
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
      
      const assistantMessage = { 
        role: 'assistant', 
        content: data.content 
      };
      
      // Update messages in memory (hidden from UI)
      setMessages([...updatedMessages, assistantMessage]);
      
      // Auto-render largest code block
      autoRenderLargestBlock(data.content);
      
    } catch (error) {
      console.error('Chat error:', error);
      setMessages([...updatedMessages, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]);
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