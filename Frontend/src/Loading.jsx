import './siteStyles.css';

export function Loading({ message = "Loading...... Also Brewing Coffee to keep the Server alive!" }) {
  return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>{message}</p>
    </div>
  );
}
