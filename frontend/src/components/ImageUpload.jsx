import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Image, AlertCircle } from "lucide-react";
import apiClient from '../utils/api';

const ImageUpload = ({ onImageUpload }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  const onDrop = useCallback(
    async (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setIsUploading(true);
      setError(null);

      try {
        // Upload to backend API
        const uploadResult = await apiClient.uploadImage(file);
        
        if (uploadResult.success) {
          // Create preview URL for UI
          const reader = new FileReader();
          reader.onload = (e) => {
            onImageUpload({
              previewUrl: e.target.result,
              sessionId: uploadResult.data.sessionId,
              originalName: file.name
            });
          };
          reader.readAsDataURL(file);
        }
      } catch (error) {
        console.error('Upload failed:', error);
        setError(error.message);
      } finally {
        setIsUploading(false);
      }
    },
    [onImageUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
  });

  return (
    <div className="max-w-2xl mx-auto">
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
          isUploading 
            ? "border-indigo-400 bg-indigo-50 opacity-75 cursor-wait"
            : isDragActive
            ? "border-indigo-400 bg-indigo-50"
            : "border-gray-300 bg-white hover:border-indigo-400 hover:bg-gray-50"
        }`}
      >
        <input {...getInputProps()} disabled={isUploading} />
        <div className="flex flex-col items-center justify-center space-y-4">
          {isUploading ? (
            <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          ) : isDragActive ? (
            <Upload className="w-16 h-16 text-indigo-400" />
          ) : (
            <Image className="w-16 h-16 text-gray-400" />
          )}
          <div>
            <p className="text-xl font-medium text-gray-900 mb-2">
              {isUploading 
                ? "Uploading..." 
                : isDragActive 
                ? "Drop your photo here" 
                : "Upload your photo"}
            </p>
            <p className="text-gray-600">
              {isUploading 
                ? "Please wait while we process your image..."
                : "Drag and drop your image here, or click to select"}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Supports JPG, PNG, WebP up to 10MB
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-3">
          Tips for best results:
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="font-medium text-gray-900 mb-1">Clear Face</div>
            <div>Make sure your face is clearly visible and well-lit</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="font-medium text-gray-900 mb-1">High Quality</div>
            <div>Use a high-resolution image for better results</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="font-medium text-gray-900 mb-1">Front Facing</div>
            <div>Face the camera directly for optimal generation</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageUpload;
