'use client';

import { useState, useCallback, useEffect } from 'react';
import { useImageContext } from '../contexts/ImageContext';

export default function TextAreaPanel({ onEditImage, onDownload }) {
  const { canvasEditor, isProcessing, setIsProcessing, updateCanvasImage } = useImageContext();
  const [textValue, setTextValue] = useState('');
  const [status, setStatus] = useState('');

  // Handle sending text to Fal AI for image editing
  const handleSendText = useCallback(async () => {
    if (!textValue.trim() || isProcessing) return;
    
    // Check if canvas editor exists and has an image
    if (!canvasEditor?.canvas) {
      setStatus('No image available');
      return;
    }

    try {
      // Get current image from canvas
      const currentImageDataUrl = canvasEditor.toDataURL();
      
      if (!currentImageDataUrl || currentImageDataUrl === 'data:,') {
        setStatus('Please load an image first');
        return;
      }

      setIsProcessing(true);
      setStatus('');

      // Call Fal AI API
      const response = await fetch('/api/fal-edit-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: textValue.trim(),
          imageDataUrl: currentImageDataUrl
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Replace image in canvas using ImageContext
        try {
          console.log('Loading new image into canvas...');
          updateCanvasImage(data.imageDataUrl);
          
          setStatus('Image edited successfully!');
          // setTextValue(''); // Clear the prompt
          
          // Clear success message after 3 seconds
          setTimeout(() => setStatus(''), 3000);
        } catch (loadError) {
          console.error('Error loading new image:', loadError);
          setStatus('Image generated but failed to load - check console for details');
          setTimeout(() => setStatus(''), 5000);
        }
      } else {
        setStatus(`Error: ${data.error}`);
        setTimeout(() => setStatus(''), 5000);
      }

    } catch (error) {
      console.error('Error editing image:', error);
      setStatus('Network error - please try again');
      setTimeout(() => setStatus(''), 5000);
    } finally {
      setIsProcessing(false);
    }
  }, [textValue, canvasEditor, isProcessing, setIsProcessing, updateCanvasImage]);

  // Handle downloading the current image from canvas
  const handleDownload = useCallback(() => {
    if (!canvasEditor?.canvas) {
      console.warn('No canvas available for download');
      return;
    }

    try {
      // Get image data from canvas
      const dataURL = canvasEditor.toDataURL();
      
      // Create download link
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = `edited-image-${Date.now()}.png`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  }, [canvasEditor]);

  // Pass functions to parent component
  useEffect(() => {
    if (onEditImage) {
      onEditImage(handleSendText);
    }
    if (onDownload) {
      onDownload(handleDownload);
    }
  }, [handleSendText, handleDownload, onEditImage, onDownload]);


  return (
    <div
      className="rounded-[46px] flex items-start justify-between w-[60vw] mt-4"
      style={{
        background: "rgba(28, 28, 28, 0.31)",
        boxShadow: "inset 0px 6px 8.4px 1px rgba(0, 0, 0, 0.08)",
        paddingTop: "38px",
        paddingBottom: "38px",
        paddingLeft: "62px",
        paddingRight: "137px",
        height: "auto",
        minHeight: "auto",
      }}
    >
      <textarea
        value={textValue}
        onChange={(e) => setTextValue(e.target.value)}
        placeholder="A beautiful scenery of a dilapidated temple in forest grounds. make the art in Ghibli style"
        className="bg-transparent text-[#aeaeae] font-mono outline-none flex-1 leading-relaxed resize-none text-lg"
        style={{ 
          wordWrap: "break-word",
          fontFamily: "var(--font-manrope), monospace"
        }}
        rows={1}
        disabled={isProcessing}
        onInput={(e) => {
          e.target.style.height = "auto"
          const newHeight = e.target.scrollHeight
          const lineHeight = 24
          const maxHeight = lineHeight * 5
          e.target.style.height = Math.min(newHeight, maxHeight) + "px"
          e.target.style.overflowY = newHeight > maxHeight ? "auto" : "hidden"
        }}
      />
      <div className="h-5 text-[#aeaeae] flex-shrink-0 cursor-pointer w-5 mt-[5px] ml-4 mr-[-76px]">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      </div>
      {status && (
        <div className={`absolute top-2 right-2 text-xs ${
          status.includes('Error') || status.includes('Please') 
            ? 'text-red-400' 
            : status.includes('successfully') 
              ? 'text-green-400'
              : 'text-blue-400'
        }`}>
          {status}
        </div>
      )}
    </div>
  );
}