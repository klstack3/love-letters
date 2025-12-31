import React, { useState } from "react";
import { Download, ZoomIn, ZoomOut } from "lucide-react";

const ComparisonView = ({ originalImage, generatedImage, downloadUrl, style, processingTime }) => {
  const [isZoomed, setIsZoomed] = useState(false);

  const handleDownload = () => {
    if (downloadUrl) {
      window.open(downloadUrl, '_blank');
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Comparison Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Original Image */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Original Photo
            </h3>
          </div>
          <div className="p-6">
            <div
              className={`relative overflow-hidden rounded-lg ${
                isZoomed ? "cursor-zoom-out" : "cursor-zoom-in"
              }`}
            >
              <img
                src={originalImage}
                alt="Original"
                className={`w-full h-96 object-cover transition-transform duration-300 ${
                  isZoomed ? "transform scale-150" : "transform scale-100"
                }`}
                onClick={() => setIsZoomed(!isZoomed)}
              />
            </div>
          </div>
        </div>

        {/* Generated Image */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Professional Headshot
              </h3>
              <p className="text-sm text-gray-600">{style} Style</p>
            </div>
            <button
              onClick={handleDownload}
              className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
          </div>
          <div className="p-6">
            <div
              className={`relative overflow-hidden rounded-lg ${
                isZoomed ? "cursor-zoom-out" : "cursor-zoom-in"
              }`}
            >
              {generatedImage ? (
                <img
                  src={generatedImage}
                  alt="Generated Headshot"
                  className={`w-full h-96 object-cover transition-transform duration-300 ${
                    isZoomed ? "transform scale-150" : "transform scale-100"
                  }`}
                  onClick={() => setIsZoomed(!isZoomed)}
                />
              ) : (
                <div className="w-full h-96 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-indigo-200 rounded-full mx-auto mb-4"></div>
                    <p className="text-indigo-600 font-medium">
                      Generated Headshot
                    </p>
                    <p className="text-sm text-indigo-500">{style} Style</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center items-center space-x-4 mb-8">
        <button
          onClick={() => setIsZoomed(!isZoomed)}
          className="flex items-center space-x-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg transition-colors"
        >
          {isZoomed ? (
            <ZoomOut className="w-4 h-4" />
          ) : (
            <ZoomIn className="w-4 h-4" />
          )}
          <span>{isZoomed ? "Zoom Out" : "Zoom In"}</span>
        </button>
      </div>

      {/* Stats/Info */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Generation Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600 mb-1">
              {processingTime ? `${(processingTime / 1000).toFixed(1)}s` : 'N/A'}
            </div>
            <div className="text-sm text-gray-600">Generation Time</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {style}
            </div>
            <div className="text-sm text-gray-600">Selected Style</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 mb-1">HD</div>
            <div className="text-sm text-gray-600">Output Quality</div>
          </div>
        </div>
      </div>

      {/* Satisfaction Survey */}
      <div className="mt-8 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 text-center">
          How satisfied are you with your headshot?
        </h3>
        <div className="flex justify-center space-x-4">
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              key={rating}
              className="w-12 h-12 rounded-full border-2 border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 transition-colors flex items-center justify-center font-medium text-indigo-600"
            >
              {rating}
            </button>
          ))}
        </div>
        <div className="flex justify-between text-sm text-gray-600 mt-2">
          <span>Not satisfied</span>
          <span>Very satisfied</span>
        </div>
      </div>
    </div>
  );
};

export default ComparisonView;
