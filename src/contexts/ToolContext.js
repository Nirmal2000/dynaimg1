'use client';

import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { getToolDefinition } from '../tools/ToolRegistry';

const ToolContext = createContext();

export const useToolContext = () => {
  const context = useContext(ToolContext);
  if (!context) {
    throw new Error('useToolContext must be used within a ToolProvider');
  }
  return context;
};

export const ToolProvider = ({ children }) => {
  // Secure, prebuilt tool entries to render (no HTML injection)
  const [renderedTools, setRenderedTools] = useState([]); // [{id,type,props}]
  const idCounterRef = useRef(0);

  const generateId = useCallback((prefix = 'tool') => {
    idCounterRef.current += 1;
    const rand = Math.random().toString(36).slice(2, 8);
    return `${prefix}-${Date.now()}-${idCounterRef.current}-${rand}`;
  }, []);

  const addToolByType = useCallback((type, props = {}, id) => {
    const def = getToolDefinition(type);
    if (!def) return null;
    const mergedProps = { ...(def.defaultProps || {}), ...(props || {}) };
    let finalId = id || generateId('tool');
    // Ensure uniqueness if called rapidly
    if (renderedTools.some(t => t.id === finalId)) {
      finalId = generateId('tool');
    }
    const newTool = { id: finalId, type, props: mergedProps };
    // Append to the end so new tools appear below existing ones
    setRenderedTools(prev => [...prev, newTool]);
    return finalId;
  }, [generateId, renderedTools]);

  const updateToolProps = useCallback((id, patch) => {
    setRenderedTools(prev => prev.map(t => t.id === id ? { ...t, props: { ...t.props, ...patch } } : t));
  }, []);

  const removeTool = useCallback((toolId) => {
    setRenderedTools(prev => prev.filter(tool => tool.id !== toolId));
  }, []);

  const clearTools = useCallback(() => {
    setRenderedTools([]);
  }, []);

  const value = {
    renderedTools,
    addToolByType,
    updateToolProps,
    removeTool,
    clearTools,
  };

  return (
    <ToolContext.Provider value={value}>
      {children}
    </ToolContext.Provider>
  );
};
