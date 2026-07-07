import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Compare from './pages/Compare';
import Heatmap from './pages/Heatmap';
import SubmitForm from './pages/SubmitForm';
import LocalPulse from './pages/LocalPulse';
import Home from './pages/Home';
import CompareStates from './pages/CompareStates';
import Chat from './pages/Chat';
import MyComplaints from './pages/MyComplaints';
import StaffDashboard from './pages/StaffDashboard';



export default function App() {
  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <Navbar />
        <main style={{ paddingBottom: '4rem' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/compare-states" element={<CompareStates />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/map" element={<Heatmap />} />
            <Route path="/submit" element={<SubmitForm />} />
            <Route path="/my-complaints" element={<MyComplaints />} />
            <Route path="/staff" element={<StaffDashboard />} />
            <Route path="/local-pulse" element={<LocalPulse />} />


          </Routes>
        </main>

        {/* Footer */}
        <footer
          style={{
            borderTop: '1px solid var(--border-subtle)',
            padding: '1.5rem',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '0.78rem',
          }}
        >
          <span>People's Priorities</span>
          <span style={{ margin: '0 0.5rem' }}>·</span>
          <span>AI Constituency Development Platform</span>
          <span style={{ margin: '0 0.5rem' }}>·</span>
          <span style={{ color: 'var(--purple)' }}>Hyderabad Constituency Demo</span>
        </footer>
      </div>
    </BrowserRouter>
  );
}
