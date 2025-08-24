'use client';

import { useState, useRef, useCallback } from 'react';
import ImagePanel from '../components/ImagePanel';
import TextAreaPanel from '../components/TextAreaPanel';
import ToolCanvas from '../components/ToolCanvas';
import SimpleChatInput from '../components/SimpleChatInput';
import { ToolProvider } from '../contexts/ToolContext';
import { ImageProvider, useImageContext } from '../contexts/ImageContext';

function HomeContent() {
  const { setSelectedImage, isProcessing } = useImageContext();
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const [editImageFunction, setEditImageFunction] = useState(null);
  const [downloadFunction, setDownloadFunction] = useState(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    
    if (!file) return;

    // Check if file is a valid image
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPEG, PNG, WEBP)');
      return;
    }

    // Clear any previous errors
    setError(null);

    // Create a FileReader to read the file
    const reader = new FileReader();
    reader.onload = (e) => {
      console.log('Image loaded, setting selectedImage:', !!e.target.result);
      setSelectedImage(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const onEditImageCallback = useCallback((func) => {
    setEditImageFunction(() => func);
  }, []);

  const onDownloadCallback = useCallback((func) => {
    setDownloadFunction(() => func);
  }, []);




  return (
    <ToolProvider>
      <div className="h-screen bg-[#3b3b3b] p-[2.5vw] flex gap-[1.25vw]">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/jpg"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {/* Main Image Area - Left Column */}
      <div className="flex-1 flex flex-col">
        {/* Image Container */}
        <div className="mb-[1.25vw]">
          <ImagePanel 
            onUploadClick={handleUploadClick}
            error={error}
          />
        </div>

        {/* Description Area */}
        <div className="mb-[4vw]">
          <TextAreaPanel 
            onEditImage={onEditImageCallback}
            onDownload={onDownloadCallback}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-[1.25vw] justify-center">
          <div 
            className="w-[16.6vw] h-[7.9vh] border-[8px] border-[#454545] rounded-[39px] flex items-center justify-center cursor-pointer hover:bg-[#424242] transition-colors"
            style={{
              background: "rgba(61, 61, 61, 0.01)",
              boxShadow: "0px -3px 10px 3px rgba(0, 0, 0, 0.07), inset 0px -7px 10px 3px rgba(0, 0, 0, 0.15)",
            }}
            onClick={() => editImageFunction && !isProcessing && editImageFunction()}
          >
            {isProcessing ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#aeaeae]"></div>
                <span className="text-[#aeaeae] font-medium text-lg" style={{ fontFamily: "var(--font-manrope)" }}>Processing...</span>
              </div>
            ) : (
              <span className="text-[#aeaeae] font-medium text-lg" style={{ fontFamily: "var(--font-manrope)" }}>Edit Image</span>
            )}
          </div>
          <div 
            className="w-[16.6vw] h-[7.9vh] border-[8px] border-[#454545] rounded-[39px] flex items-center justify-center cursor-pointer hover:bg-[#424242] transition-colors"
            style={{
              background: "rgba(61, 61, 61, 0.01)",
              boxShadow: "0px -3px 10px 3px rgba(0, 0, 0, 0.07), inset 0px -7px 10px 3px rgba(0, 0, 0, 0.15)",
            }}
            onClick={() => downloadFunction && downloadFunction()}
          >
            <span className="text-[#aeaeae] font-medium text-lg" style={{ fontFamily: "var(--font-manrope)" }}>Download</span>
          </div>
        </div>
      </div>

      {/* Right Column - ToolBox Panel */}
      <div 
        className="h-[88.1vh] border-[10px] border-[#454545] rounded-[71px] pt-[2.1vw] px-[4.75vw] pb-[2.05vw] flex flex-col w-[32vw]"
        style={{
          background: "rgba(255, 255, 255, 0.01)",
          boxShadow: "0px -5px 14.8px 5px rgba(0, 0, 0, 0.08), inset 0px -5px 15.5px 9px rgba(0, 0, 0, 0.09)",
        }}
      >
        <div className="flex-1 flex flex-col min-h-0">
          {/* ToolBox Header */}
          <div className="mb-[1.25vw] flex-shrink-0">
            <h2
              className="text-[#aeaeae] text-lg font-medium mb-[0.625vw]"
              style={{ fontFamily: "var(--font-manrope), sans-serif" }}
            >
              ToolBox
            </h2>
            <div className="w-full h-px bg-[#515050] mb-[0.625vw] mt-[33px]"></div>
          </div>

          {/* Tool Canvas */}
          <div className="flex-1 overflow-hidden min-h-0">
            <ToolCanvas />
          </div>
        </div>

        {/* Bottom Chat Input */}
        <div
          className="rounded-[41.5px] px-[1.25vw] py-3 flex items-center justify-between mx-[-40px] w-[118%] mt-[1.25vw]"
          style={{
            background: "rgba(28, 28, 28, 0.31)",
            boxShadow: "inset 0px 8px 8.4px 1px rgba(0, 0, 0, 0.06)",
            minHeight: "7.7%",
          }}
        >
          <SimpleChatInput />
        </div>
      </div>
      </div>
    </ToolProvider>
  );
}

export default function Home() {
  return (
    <ImageProvider>
      <ToolProvider>
        <HomeContent />
      </ToolProvider>
    </ImageProvider>
  );
}
