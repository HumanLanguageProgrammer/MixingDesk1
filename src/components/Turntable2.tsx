// src/components/Turntable2.tsx

import type { LibraryItem } from '../types';

interface Turntable2Props {
  content: string;
  libraryItems: LibraryItem[];
  onSelectItem: (item: LibraryItem) => void;
  isLoading: boolean;
}

export function Turntable2({ content, libraryItems, onSelectItem, isLoading }: Turntable2Props) {
  return (
    <div className="h-full bg-gray-800 rounded-lg border border-gray-700 flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700">
        <h2 className="text-sm font-medium text-gray-300">
          Turntable 2
          <span className="ml-2 text-gray-500 font-normal">Content Display</span>
        </h2>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-auto">
        {isLoading ? (
          <div className="text-gray-500 text-center py-8">
            <p className="text-sm">Loading content...</p>
          </div>
        ) : content ? (
          <div className="prose prose-invert prose-sm max-w-none">
            <p className="text-gray-300 whitespace-pre-wrap">{content}</p>
          </div>
        ) : (
          <div className="text-gray-500 text-center py-8">
            <p className="text-sm">No content loaded</p>
          </div>
        )}
      </div>

      {/* Library Item Selector (for testing) */}
      {libraryItems.length > 0 && (
        <div className="border-t border-gray-700 p-3">
          <p className="text-xs text-gray-500 mb-2">Library Items (test selector):</p>
          <div className="flex flex-wrap gap-2">
            {libraryItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelectItem(item)}
                className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded transition-colors"
              >
                {item.title}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
