// src/components/Turntable2.tsx
// PHASE B: Agent-controlled content display (no manual selector)

interface Turntable2Props {
  content: string;
  title?: string;
  isLoading: boolean;
}

export function Turntable2({ content, title, isLoading }: Turntable2Props) {
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
            {title && (
              <h3 className="text-lg font-semibold text-gray-200 mb-3">{title}</h3>
            )}
            <p className="text-gray-300 whitespace-pre-wrap">{content}</p>
          </div>
        ) : (
          <div className="text-gray-500 text-center py-8">
            <svg className="w-16 h-16 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm">No content loaded</p>
            <p className="text-xs mt-1 text-gray-600">Agent will display content here</p>
          </div>
        )}
      </div>
    </div>
  );
}
