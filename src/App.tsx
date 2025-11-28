// src/App.tsx

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CheckIn } from './components/CheckIn';
import { CheckOut } from './components/CheckOut';
import { MixingDesk } from './components/MixingDesk';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default redirect to check-in */}
        <Route path="/" element={<Navigate to="/checkin" replace />} />

        {/* CIOS: Check-In */}
        <Route path="/checkin" element={<CheckIn />} />

        {/* VWS: Session (existing Mixing Desk + visit awareness) */}
        <Route path="/session/:visitId" element={<MixingDesk />} />

        {/* CIOS: Check-Out */}
        <Route path="/checkout/:visitId" element={<CheckOut />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/checkin" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
