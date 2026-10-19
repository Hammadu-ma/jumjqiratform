export default function EventsTicker({ events }) {
  if (!events.length) return null;
  // Duplicated once so the CSS animation can loop seamlessly from -50% back to 0%.
  const track = [...events, ...events];

  return (
    <div className="events-ticker">
      <div className="events-track">
        {track.map((e, i) => (
          <div className="event-card" key={`${e.id}-${i}`}>
            <i className="fa-solid fa-bullhorn" />
            <div>
              <div className="event-title">{e.title}</div>
              {e.body && <div className="event-body">{e.body}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
