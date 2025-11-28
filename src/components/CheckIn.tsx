// src/components/CheckIn.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createVisit, updateVisitStatus } from '../lib/visits';

export function CheckIn() {
  const navigate = useNavigate();
  const [visitorName, setVisitorName] = useState('');
  const [initialNote, setInitialNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartSession = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Create visit record
      const visit = await createVisit({
        visitor_name: visitorName || undefined,
        initial_note: initialNote || undefined,
      });

      // Update status to engaged
      await updateVisitStatus(visit.id, 'engaged');

      // Navigate to session with visit ID
      navigate(`/session/${visit.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start session');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold">Welcome</h1>
          <p className="text-gray-400 mt-2">Context Craft Learning Lab</p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Name (optional) */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Your name (optional)
            </label>
            <input
              type="text"
              value={visitorName}
              onChange={(e) => setVisitorName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Initial note */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              What brings you here today?
            </label>
            <textarea
              value={initialNote}
              onChange={(e) => setInitialNote(e.target.value)}
              placeholder="Tell us what you'd like to explore..."
              rows={3}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* Error display */}
          {error && (
            <div className="text-red-400 text-sm">{error}</div>
          )}

          {/* Start button */}
          <button
            onClick={handleStartSession}
            disabled={isLoading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg font-medium transition-colors"
          >
            {isLoading ? 'Starting...' : 'Start Session'}
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500">
          CIOS Check-In - Operation Basecamp
        </p>
      </div>
    </div>
  );
}
