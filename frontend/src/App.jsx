import React, { useState } from "react";
import ImageUpload from "./components/ImageUpload";
import StyleSelector from "./components/StyleSelector";
import ComparisonView from "./components/ComparisonView";
import LoadingSpinner from "./components/LoadingSpinner";
import apiClient from './utils/api';

function App() {
  const [step, setStep] = useState(1);
  const [uploadData, setUploadData] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [generatedData, setGeneratedData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleImageUpload = (data) => {
    setUploadData(data);
    setError(null);
    setStep(2);
  };

  const handleStyleSelect = (style) => {
    setSelectedStyle(style);
    setStep(3);
  };

  const handleGenerate = async () => {
    if (!uploadData || !selectedStyle) return;

    setIsLoading(true);
    setError(null);

    try {
      // Generate headshot using real AI API
      const result = await apiClient.generateHeadshot(uploadData.sessionId, selectedStyle);
      
      if (result.success) {
        setGeneratedData({
          imageId: result.data.imageId,
          imageUrl: apiClient.getImageUrl(result.data.imageId),
          downloadUrl: apiClient.getDownloadUrl(result.data.imageId),
          style: result.data.style,
          processingTime: result.data.processingTime
        });
        setStep(4);
      }
    } catch (error) {
      console.error('Generation failed:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setUploadData(null);
    setSelectedStyle(null);
    setGeneratedData(null);
    setIsLoading(false);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Professional Headshot AI
            </h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4].map((num) => (
                  <div
                    key={num}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step >= num
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {num}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {step === 1 && (
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Upload Your Photo
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Start by uploading a clear photo of yourself
            </p>
            <ImageUpload onImageUpload={handleImageUpload} />
          </div>
        )}

        {step === 2 && (
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Choose Your Style
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Select the professional headshot style you prefer
            </p>
            <StyleSelector onStyleSelect={handleStyleSelect} />
          </div>
        )}

        {step === 3 && (
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Generate Your Headshot
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Ready to create your professional headshot?
            </p>
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-center">
                <p className="text-red-700">{error}</p>
              </div>
            )}
            
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
              <div className="mb-6">
                {uploadData && (
                  <img
                    src={uploadData.previewUrl}
                    alt="Uploaded"
                    className="w-32 h-32 object-cover rounded-full mx-auto mb-4"
                  />
                )}
                <p className="text-sm text-gray-600 mb-2">
                  Selected Style:{" "}
                  <span className="font-medium">{selectedStyle}</span>
                </p>
              </div>
              <button
                onClick={handleGenerate}
                disabled={isLoading || !uploadData}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                {isLoading ? "Generating..." : "Generate Headshot"}
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Your Professional Headshot
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Compare your original photo with the AI-generated headshot
            </p>
            <ComparisonView
              originalImage={uploadData?.previewUrl}
              generatedImage={generatedData?.imageUrl}
              downloadUrl={generatedData?.downloadUrl}
              style={selectedStyle}
              processingTime={generatedData?.processingTime}
            />
            <div className="mt-8 space-x-4">
              <button
                onClick={handleReset}
                className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                Start Over
              </button>
              {generatedData && (
                <a
                  href={generatedData.downloadUrl}
                  download
                  className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                >
                  Download Headshot
                </a>
              )}
            </div>
          </div>
        )}

        {isLoading && <LoadingSpinner />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-600">
            Inspired by{" "}
            <a
              href="https://creatoreconomy.so/p/full-tutorial-build-an-ai-headshot-app-with-google-nano-banana-in-15-minutes"
              className="text-indigo-600 hover:text-indigo-500"
              target="_blank"
              rel="noopener noreferrer"
            >
              Creator Economy Tutorial
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
