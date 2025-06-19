import React, { useState, useEffect } from 'react';
import './styles.css';

const darkJokes = [
  "Encrypting your files, because therapy is too expensive.",
  "Deleting files like your ex deletes your number.",
  "Keeping files? Bold move. Hope you don't regret it.",
  "Erasing traces like a pro—no one will ever know you had that file. Probably.",
  "Remember: If you forget your password, not even your future self can save you."
];

function getRandomJoke() {
  return darkJokes[Math.floor(Math.random() * darkJokes.length)];
}

const initialHistory = [];

// Use window.electron.ipcRenderer in the renderer process
const ipcRenderer = window.electron && window.electron.ipcRenderer ? window.electron.ipcRenderer : null;

const App = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [password, setPassword] = useState('');
  const [action, setAction] = useState('keep');
  const [history, setHistory] = useState(initialHistory);
  const [joke, setJoke] = useState(getRandomJoke());
  const [uiScale, setUiScale] = useState(() => {
    const saved = localStorage.getItem('ui-scale');
    return saved ? Number(saved) : 100;
  });

  useEffect(() => {
    document.body.style.zoom = `${uiScale}%`;
    localStorage.setItem('ui-scale', uiScale);
  }, [uiScale]);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setJoke(getRandomJoke());
  };

  const handleEncrypt = () => {
    if (!selectedFile || !password) return;
    // Send IPC message to main process
    if (ipcRenderer) {
      const pathToSend = selectedFile.path || selectedFile.webkitRelativePath || '';
      ipcRenderer.send('encrypt-file', pathToSend, password, action);
    }
    setHistory([
      {
        name: selectedFile.name,
        date: new Date().toLocaleString(),
        action,
      },
      ...history,
    ]);
    setJoke(getRandomJoke());
    setSelectedFile(null);
    setPassword('');
  };

  // Window control handlers
  const handleMinimize = () => {
    if (ipcRenderer) ipcRenderer.send('window-control', 'minimize');
  };
  const handleMaximize = () => {
    if (ipcRenderer) ipcRenderer.send('window-control', 'maximize');
  };
  const handleClose = () => {
    if (ipcRenderer) ipcRenderer.send('window-control', 'close');
  };

  return (
    <div className="app-container">
      {/* Window Controls Fixed Top-Right */}
      <div className="window-controls-fixed">
        <button className="window-btn minimize" title="Minimize" onClick={handleMinimize}>
          &#8211;
        </button>
        <button className="window-btn maximize" title="Maximize" onClick={handleMaximize}>
          &#9723;
        </button>
        <button className="window-btn close" title="Close" onClick={handleClose}>
          &#10005;
        </button>
      </div>
      <header>
        <h1>File Encryptor GUI</h1>
        <div className="joke">{joke}</div>
        {/* UI scale slider */}
        <div style={{position:'absolute',left:'2vw',top:'1.5vw',display:'flex',alignItems:'center',gap:'0.5vw'}}>
          <label htmlFor="scaleRange2" style={{fontSize:'0.9vw'}}>UI&nbsp;Scale</label>
          <input
            id="scaleRange2"
            type="range"
            min="80"
            max="150"
            value={uiScale}
            onChange={(e)=>setUiScale(Number(e.target.value))}
            style={{width:'8vw'}}
          />
        </div>
      </header>
      <main>
        <section className="upload-section">
          <h2>Encrypt a File</h2>
          <input
            type="file"
            onChange={handleFileChange}
            className="file-input"
          />
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="password-input"
          />
          <div className="action-group">
            <label>
              <input
                type="radio"
                name="action"
                value="delete"
                checked={action === 'delete'}
                onChange={() => setAction('delete')}
              />
              Delete Original (Poof! Gone forever.)
            </label>
            <label>
              <input
                type="radio"
                name="action"
                value="keep"
                checked={action === 'keep'}
                onChange={() => setAction('keep')}
              />
              Keep Original (Because sometimes you just want to hold onto the past.)
            </label>
            <label>
              <input
                type="radio"
                name="action"
                value="erase"
                checked={action === 'erase'}
                onChange={() => setAction('erase')}
              />
              Erase Traces (Feel like a secret agent.)
            </label>
          </div>
          <button onClick={handleEncrypt} className="encrypt-btn" disabled={!selectedFile || !password}>
            Encrypt
          </button>
        </section>
        <section className="history-section">
          <h2>File History</h2>
          {history.length === 0 ? (
            <div className="empty-history">No files encrypted yet. Your secrets are safe... for now.</div>
          ) : (
            <table className="history-table">
              <thead>
                <tr>
                  <th>File Name</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.name}</td>
                    <td>{item.date}</td>
                    <td>{item.action === 'delete' ? 'Deleted' : item.action === 'keep' ? 'Kept' : 'Erased Traces'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>
      <footer>
        <span>File Encryptor GUI &copy; {new Date().getFullYear()} &mdash; Encrypt wisely, laugh darkly.</span><br/>
        <span className="tagline">Built by Nads, for Nads.</span>
      </footer>
    </div>
  );
};

export default App;