import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import AdminDashboard from './pages/AdminDashboard';
import FieldWorker from './pages/FieldWorker';
import VolunteerApp from './pages/VolunteerApp';

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<AdminDashboard />} />
            <Route path="/field" element={<FieldWorker />} />
            <Route path="/volunteer" element={<VolunteerApp />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
