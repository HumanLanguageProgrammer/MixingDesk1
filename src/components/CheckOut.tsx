// src/components/CheckOut.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getVisit, addVisitNote, updateVisitStatus } from '../lib/visits';
import type { Visit } from '../types';

export function CheckOut() {
  const { visitId } = useParams<{ visitId: string }>();
  const navigate = useNavigate();

  const [visit, setVisit] = useState<Visit | null>(null);
  const [finalNote, setFinalNote] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load visit on mount
  useEffect(() => {
    async function loadVisit() {
      if (!visitId) {
        setError('No visit ID provided');
        setIsLoading(false);
        return;
      }

      try {
        const data = await getVisit(visitId);
        if (!data) {
          setError('Visit not found');
        } else {
          setVisit(data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load visit');
      } finally {
        setIsLoading(false);
      }
    }

    loadVisit();
  }, [visitId]);

  const handleCompleteVisit = async () => {
    if (!visitId) return;

    setIsSaving(true);
    setError(null);

    try {
      // Add final note if provided
      if (finalNote.trim()) {
        await addVisitNote(visitId, 'checkout', finalNote.trim());
      }

      // Update status to complete
      await updateVisitStatus(visitId, 'complete');

      // Navigate back to check-in
      navigate('/checkin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete visit');
      setIsSaving(false);
    }
  };

  const handleStartNew = () => {
    navigate('/checkin');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p>Loading visit...</p>
      </div>
    );
  }

  if (error || !visit) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <p className="text-red-400">{error || 'Visit not found'}</p>
          <button
            onClick={handleStartNew}
            className="px-4 py-2 bg-blue-600 rounded-lg"
          >
            Start New Visit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold">Session Complete</h1>
          {visit.visitor_name && (
            <p className="text-gray-400 mt-2">Thank you, {visit.visitor_name}!</p>
          )}
        </div>

        {/* Visit Notes Summary */}
        <div className="bg-gray-800 rounded-lg p-4 space-y-3">
          <h2 className="font-medium text-gray-300">Session Notes</h2>
          {visit.notes.length === 0 ? (
            <p className="text-gray-500 text-sm">No notes recorded</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {visit.notes.map((note, index) => (
                <div key={index} className="text-sm">
                  <span className="text-gray-500">
                    [{note.source}]
                  </span>{' '}
                  <span className="text-gray-300">{note.content}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Final note */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">
            Any final thoughts?
          </label>
          <textarea
            value={finalNote}
            onChange={(e) => setFinalNote(e.target.value)}
            placeholder="Optional feedback or notes..."
            rows={2}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
          />
        </div>

        {/* Error display */}
        {error && (
          <div className="text-red-400 text-sm">{error}</div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={handleCompleteVisit}
            disabled={isSaving}
            className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg font-medium transition-colors"
          >
            {isSaving ? 'Saving...' : 'Complete Visit'}
          </button>

          <button
            onClick={handleStartNew}
            className="w-full py-2 text-gray-400 hover:text-white transition-colors"
          >
            Start New Visit
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500">
          CIOS Check-Out - Visit: {visitId?.slice(0, 8)}...
        </p>
      </div>
    </div>
  );
}
