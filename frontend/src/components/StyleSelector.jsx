import React, { useState } from "react";
import { Check } from "lucide-react";

const StyleSelector = ({ onStyleSelect }) => {
  const [selectedStyle, setSelectedStyle] = useState(null);

  const styles = [
    {
      id: "corporate-classic",
      name: "Corporate Classic",
      description: "Traditional business attire with neutral backgrounds",
      features: [
        "Professional suit",
        "Neutral background",
        "Classic lighting",
        "Conservative style",
      ],
      preview: "/api/placeholder/300/400",
    },
    {
      id: "creative-professional",
      name: "Creative Professional",
      description: "Modern, stylish look suitable for creative industries",
      features: [
        "Contemporary attire",
        "Artistic background",
        "Dynamic lighting",
        "Modern aesthetic",
      ],
      preview: "/api/placeholder/300/400",
    },
    {
      id: "executive-portrait",
      name: "Executive Portrait",
      description: "Premium, authoritative style for senior leadership roles",
      features: [
        "Executive attire",
        "Premium backdrop",
        "Studio lighting",
        "Authority presence",
      ],
      preview: "/api/placeholder/300/400",
    },
  ];

  const handleStyleClick = (style) => {
    setSelectedStyle(style.id);
  };

  const handleContinue = () => {
    if (selectedStyle) {
      const style = styles.find((s) => s.id === selectedStyle);
      onStyleSelect(style.name);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {styles.map((style) => (
          <div
            key={style.id}
            onClick={() => handleStyleClick(style)}
            className={`bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer transition-all duration-200 ${
              selectedStyle === style.id
                ? "ring-2 ring-indigo-500 transform scale-105"
                : "hover:shadow-xl hover:transform hover:scale-105"
            }`}
          >
            {/* Preview Image */}
            <div className="relative h-64 bg-gradient-to-br from-gray-100 to-gray-200">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gray-300 rounded-full mx-auto mb-4"></div>
                  <div className="text-sm text-gray-500">Preview Image</div>
                </div>
              </div>
              {selectedStyle === style.id && (
                <div className="absolute top-4 right-4">
                  <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {style.name}
              </h3>
              <p className="text-gray-600 mb-4">{style.description}</p>

              {/* Features */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900">Features:</h4>
                <ul className="space-y-1">
                  {style.features.map((feature, index) => (
                    <li
                      key={index}
                      className="text-sm text-gray-600 flex items-center"
                    >
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full mr-2"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedStyle && (
        <div className="mt-12 text-center">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Style Selected: {styles.find((s) => s.id === selectedStyle)?.name}
            </h3>
            <p className="text-gray-600 mb-6">
              {styles.find((s) => s.id === selectedStyle)?.description}
            </p>
            <button
              onClick={handleContinue}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Continue with this style
            </button>
          </div>
        </div>
      )}

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          You can always come back and try different styles later
        </p>
      </div>
    </div>
  );
};

export default StyleSelector;
