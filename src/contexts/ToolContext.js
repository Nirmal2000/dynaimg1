'use client';

import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

const ToolContext = createContext();

export const useToolContext = () => {
  const context = useContext(ToolContext);
  if (!context) {
    throw new Error('useToolContext must be used within a ToolProvider');
  }
  return context;
};

export const ToolProvider = ({ children }) => {
  const [renderedTools, setRenderedTools] = useState([]);
  // Use useRef to persist executedScripts across rerenders
  const executedScriptsRef = useRef(new Set());
  const toolScriptsRef = useRef(new Map()); // Store scripts for re-execution

  // Add a new tool to the canvas
  const addTool = useCallback((code, id = `tool-${Date.now()}`) => {
    // Process HTML to extract just the body content and style for seamless integration
    const processedHtml = processToolHtml(code, id);
    
    const newTool = {
      id,
      processedHtml,
      timestamp: Date.now()
    };
    
    setRenderedTools(prev => [newTool, ...prev]);
    return id;
  }, []);

  // Remove a tool from the canvas
  const removeTool = useCallback((toolId) => {
    setRenderedTools(prev => prev.filter(tool => tool.id !== toolId));
  }, []);

  // Clear all tools
  const clearTools = useCallback(() => {
    setRenderedTools([]);
    executedScriptsRef.current = new Set(); // Clear script tracking when clearing tools
    toolScriptsRef.current = new Map(); // Clear stored scripts
  }, []);

  // Process HTML code to extract and adapt content for seamless integration
  const processToolHtml = useCallback((code, toolId) => {
    // Extract JavaScript and scope it to this specific tool
    const scriptMatches = code.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
    let jsCode = '';
    
    if (scriptMatches) {
      jsCode = scriptMatches.map(script => {
        const match = script.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
        return match ? match[1] : '';
      }).join('\n');
    }

    // Remove script tags from HTML
    const htmlWithoutScripts = code.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');

    // If it's a complete HTML document, extract body content and style
    if (htmlWithoutScripts.includes('<html') || htmlWithoutScripts.includes('<!DOCTYPE')) {
      // Parse the complete HTML document
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlWithoutScripts, 'text/html');
      
      // Extract styles from head
      const styles = Array.from(doc.querySelectorAll('style'))
        .map(style => style.innerHTML)
        .join('\n');
      
      // Extract body content
      const bodyContent = doc.body.innerHTML;
      
      // Store script for potential re-execution and execute if not already executed
      if (jsCode) {
        toolScriptsRef.current.set(toolId, jsCode);
        if (!executedScriptsRef.current.has(toolId)) {
          executedScriptsRef.current.add(toolId);
          setTimeout(() => {
            try {
              // Wrap in IIFE to create scope isolation
              const wrappedCode = `(function() { ${jsCode} })();`;
              eval(wrappedCode);
            } catch (error) {
              console.error(`Error executing tool script for ${toolId}:`, error);
            }
          }, 100);
        } else {
          // Re-execute script for rerendered tools
          setTimeout(() => {
            try {
              const wrappedCode = `(function() { ${jsCode} })();`;
              eval(wrappedCode);
            } catch (error) {
              console.error(`Error re-executing tool script for ${toolId}:`, error);
            }
          }, 100);
        }
      }
      
      // Combine with integrated styling
      return `
        <style>
          ${styles}
          /* Override body styles for seamless integration */
          * {
            box-sizing: border-box;
          }
        </style>
        ${bodyContent}
      `;
    } else {
      // Store script for potential re-execution and execute if not already executed
      if (jsCode) {
        toolScriptsRef.current.set(toolId, jsCode);
        if (!executedScriptsRef.current.has(toolId)) {
          executedScriptsRef.current.add(toolId);
          setTimeout(() => {
            try {
              // Wrap in IIFE to create scope isolation
              const wrappedCode = `(function() { ${jsCode} })();`;
              eval(wrappedCode);
            } catch (error) {
              console.error(`Error executing tool script for ${toolId}:`, error);
            }
          }, 10);
        } else {
          // Re-execute script for rerendered tools
          setTimeout(() => {
            try {
              const wrappedCode = `(function() { ${jsCode} })();`;
              eval(wrappedCode);
            } catch (error) {
              console.error(`Error re-executing tool script for ${toolId}:`, error);
            }
          }, 10);
        }
      }
      
      // If it's just body content, wrap it with basic styling
      return `
        <style>
          * {
            box-sizing: border-box;
          }
        </style>
        ${htmlWithoutScripts}
      `;
    }
  }, []);

  const value = {
    renderedTools,
    addTool,
    removeTool,
    clearTools
  };

  return (
    <ToolContext.Provider value={value}>
      {children}
    </ToolContext.Provider>
  );
};