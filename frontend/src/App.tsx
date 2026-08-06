import { WizardShell } from './components/WizardShell';
import './index.css';

export default function App() {
  return (
    <div className="h-full">
      <style>{`
        .btn-primary {
          background: linear-gradient(135deg, #c6ff00, #76ff03);
          color: #0f1a14;
          font-weight: 600;
          border: none;
          border-radius: 0.75rem;
          padding: 0.55rem 1rem;
          cursor: pointer;
        }
        .btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }
        .btn-secondary {
          background: transparent;
          color: #e8f5e9;
          border: 1px solid rgba(255,255,255,0.25);
          border-radius: 0.75rem;
          padding: 0.55rem 1rem;
          cursor: pointer;
        }
        .btn-secondary:disabled { opacity: 0.45; cursor: not-allowed; }
      `}</style>
      <WizardShell />
    </div>
  );
}
