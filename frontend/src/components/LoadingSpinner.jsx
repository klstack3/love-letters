import React from "react";
import { Loader2 } from "lucide-react";

const LoadingSpinner = () => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md mx-4">
        <div className="text-center">
          {/* Animated Spinner */}
          <div className="relative mb-6">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto" />
          </div>

          {/* Title */}
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Generating Your Headshot
          </h3>

          {/* Description */}
          <p className="text-gray-600 mb-6">
            Our AI is creating your professional headshot. This usually takes a
            few seconds.
          </p>

          {/* Progress Steps */}
          <div className="space-y-3 text-left">
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-green-500 rounded-full flex-shrink-0"></div>
              <span className="text-sm text-gray-700">
                Processing your image
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-indigo-500 rounded-full flex-shrink-0 animate-pulse"></div>
              <span className="text-sm text-gray-700">
                Applying professional style
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-gray-300 rounded-full flex-shrink-0"></div>
              <span className="text-sm text-gray-500">Finalizing details</span>
            </div>
          </div>

          {/* Estimated Time */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">Estimated time: 30 seconds</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
