import { signOut } from 'firebase/auth';
import { auth } from './lib/firebase.js';
import { useAuth } from './hooks/useAuth.js';
import { useStudentProfile } from './hooks/useStudentProfile.js';
import LoginScreen from './components/LoginScreen.jsx';
import Dashboard from './components/Dashboard.jsx';
import SplashScreen from './components/SplashScreen.jsx';

export default function App() {
  const { user, checking } = useAuth();

  if (checking) return <SplashScreen text="Checking your session…" />;
  if (!user) return <LoginScreen />;
  return <Signed uid={user.uid} />;
}

function Signed({ uid }) {
  const { loading, student, subjects, error, refresh } = useStudentProfile(uid);

  if (loading) return <SplashScreen text="Loading your profile…" />;

  if (error === 'not-enrolled') {
    return (
      <ErrorCard
        title="No student record found"
        action={{ label: 'Sign out', onClick: () => signOut(auth) }}
      >
        This account isn’t linked to a student profile yet. Ask your admin to check your enrollment.
      </ErrorCard>
    );
  }

  if (error) {
    return (
      <ErrorCard title="Something went wrong" action={{ label: 'Sign out', onClick: () => signOut(auth) }}>
        {error}
      </ErrorCard>
    );
  }

  return <Dashboard student={student} subjects={subjects} onProfileUpdated={refresh} />;
}

function ErrorCard({ title, children, action }) {
  return (
    <div className="login-shell">
      <div className="login-card" style={{ textAlign: 'center' }}>
        <div className="login-brand" style={{ justifyContent: 'center' }}>
          <div className="mark">J</div>
          <div style={{ textAlign: 'left' }}>
            <div className="name">JUMJ</div>
            <span className="tag">Student Portal</span>
          </div>
        </div>
        {title && <h1 className="login-title" style={{ fontSize: 19 }}>{title}</h1>}
        <p className="login-sub">{children}</p>
        {action && (
          <button className="login-btn" onClick={action.onClick} type="button">
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}
