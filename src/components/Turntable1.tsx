// src/components/Turntable1.tsx

import type { ImageAsset } from '../types';

interface Turntable1Props {
  image: ImageAsset | null;
  isLoading: boolean;
}

export function Turntable1({ image, isLoading }: Turntable1Props) {
  return (
    <div className="h-full bg-gray-800 rounded-lg border border-gray-700 flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700">
        <h2 className="text-sm font-medium text-gray-300">
          Turntable 1
          <span className="ml-2 text-gray-500 font-normal">Visual Display</span>
        </h2>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 flex items-center justify-center">
        {isLoading ? (
          <div className="text-gray-500">
            <LoadingSpinner />
            <p className="mt-2 text-sm">Loading image...</p>
          </div>
        ) : image ? (
          <div className="w-full h-full flex flex-col">
            <img
              src={image.url}
              alt={image.name}
              className="max-w-full max-h-full object-contain rounded"
              onError={(e) => {
                console.error('Image load error:', image.url);
                e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23374151" width="100" height="100"/><text fill="%239CA3AF" x="50" y="50" text-anchor="middle" dy=".3em" font-size="12">Error</text></svg>';
              }}
            />
            <p className="mt-2 text-xs text-gray-500 text-center truncate">
              {image.name}
            </p>
          </div>
        ) : (
          <div className="text-gray-500 text-center">
            <svg className="w-16 h-16 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm">No image loaded</p>
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <svg className="animate-spin h-8 w-8 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
}
