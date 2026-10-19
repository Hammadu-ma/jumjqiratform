export default function SplashScreen({ text }) {
  return (
    <div className="splash">
      <div className="splash-mark">
        <span>J</span>
      </div>
      <div className="splash-name">JUMJ</div>
      <div className="splash-tag">Student Portal</div>
      <div className="splash-dots">
        <span /><span /><span />
      </div>
      {text && <div className="splash-text">{text}</div>}
    </div>
  );
}
