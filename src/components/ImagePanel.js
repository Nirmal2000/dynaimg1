'use client';
import { useEffect } from 'react';
import { useImageContext } from '../contexts/ImageContext';

export default function ImagePanel({ onUploadClick, error }) {
  const { selectedImage, setCanvasRef, loadImageToCanvas } = useImageContext();

  useEffect(() => {
    if (selectedImage) {
      loadImageToCanvas(selectedImage);
    }
  }, [selectedImage, loadImageToCanvas]);

  if (selectedImage) {
    return (
      <div className="relative h-[56vh] bg-[#515050] rounded-[2.875rem] border-[0.625rem] border-[#515050] overflow-hidden w-[60vw]"
           style={{
             boxShadow: "0px -5px 17.9px 5px rgba(0,0,0,0.18)"
           }}>
        <div className="w-full h-full flex items-center justify-center">
          <canvas
            ref={setCanvasRef}
            className="max-w-full max-h-full rounded-lg"
          />
        </div>
        <button
          onClick={onUploadClick}
          className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm hover:bg-opacity-70 transition-all z-10"
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="relative h-[56vh] bg-[#515050] rounded-[2.875rem] border-[0.625rem] border-[#515050] overflow-hidden w-[60vw] flex flex-col items-center justify-center"
         style={{
           boxShadow: "0px -5px 17.9px 5px rgba(0,0,0,0.18)"
         }}>
      <div className="text-center">
        <div className="mb-6">
          <svg className="w-16 h-16 mx-auto text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <button
          onClick={onUploadClick}
          className="bg-white text-black px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors mb-4"
        >
          Upload Image
        </button>
        <p className="text-gray-400 text-sm">Select JPEG, PNG, or WEBP files</p>
        {error && (
          <p className="text-red-400 text-sm mt-2">{error}</p>
        )}
      </div>
    </div>
  );
}