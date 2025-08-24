'use client';

import { createContext, useContext, useState, useRef, useCallback } from 'react';

const ImageContext = createContext();

export const useImageContext = () => {
  const context = useContext(ImageContext);
  if (!context) {
    throw new Error('useImageContext must be used within an ImageProvider');
  }
  return context;
};

export const ImageProvider = ({ children }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const canvasRef = useRef(null);
  const currentImageRef = useRef(null);
  const originalImageDataRef = useRef(null);

  // Stable canvas editor object that survives rerenders
  const canvasEditor = useRef({
    canvas: null,
    ctx: null,
    getImageData: () => {
      if (!canvasRef.current) return null;
      const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
      return ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
    },
    putImageData: (imageData) => {
      if (!canvasRef.current) return;
      const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
      ctx.putImageData(imageData, 0, 0);
    },
    toDataURL: () => {
      if (!canvasRef.current) return 'data:,';
      return canvasRef.current.toDataURL();
    },
    reset: () => {
      if (!canvasRef.current || !originalImageDataRef.current) return;
      const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
      ctx.putImageData(originalImageDataRef.current, 0, 0);
    }
  }).current;

  const loadImageToCanvas = useCallback((imageSrc) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      currentImageRef.current = img;
      originalImageDataRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Update stable canvas editor references
      canvasEditor.canvas = canvas;
      canvasEditor.ctx = ctx;
    };
    
    img.src = imageSrc;
  }, [canvasEditor]);

  const setCanvasRef = useCallback((ref) => {
    canvasRef.current = ref;
    if (ref) {
      canvasEditor.canvas = ref;
      canvasEditor.ctx = ref.getContext('2d', { willReadFrequently: true });
    }
  }, [canvasEditor]);

  // Handle image editing with new image data
  const updateCanvasImage = useCallback((newImageDataUrl) => {
    if (!canvasRef.current) return;
    
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      // Update references without triggering rerenders
      currentImageRef.current = img;
      canvasEditor.canvas = canvas;
      canvasEditor.ctx = ctx;
    };
    img.src = newImageDataUrl;
  }, [canvasEditor]);

  const value = {
    // Image state
    selectedImage,
    setSelectedImage,
    isProcessing,
    setIsProcessing,
    
    // Canvas operations
    canvasRef: canvasRef.current,
    setCanvasRef,
    loadImageToCanvas,
    updateCanvasImage,
    
    // Stable canvas editor that tools can use
    canvasEditor,
    
    // Helper methods
    getCurrentImageDataUrl: () => canvasEditor.toDataURL(),
    resetToOriginal: () => canvasEditor.reset()
  };

  return (
    <ImageContext.Provider value={value}>
      {children}
    </ImageContext.Provider>
  );
};