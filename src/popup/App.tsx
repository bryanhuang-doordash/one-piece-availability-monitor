import React, { useEffect, useState } from 'react';
import { ExtensionConfig, MonitorState } from '../shared/types';
import { DEFAULT_CONFIG, DEFAULT_STATE } from '../shared/constants';
import ConfigForm from './ConfigForm';
import StatusDisplay from './StatusDisplay';

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  header: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#333',
    paddingBottom: '8px',
    borderBottom: '1px solid #ddd',
  },
};

export default function App() {
  const [config, setConfig] = useState<ExtensionConfig>(DEFAULT_CONFIG);
  const [state, setState] = useState<MonitorState>(DEFAULT_STATE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load initial state from background
    chrome.runtime.sendMessage({ type: 'GET_STATE' }, (response) => {
      if (response) {
        setConfig(response.config || DEFAULT_CONFIG);
        setState(response.state || DEFAULT_STATE);
      }
      setLoading(false);
    });

    // Listen for state updates from background
    const listener = (message: { type: string; payload: MonitorState }) => {
      if (message.type === 'STATE_UPDATE') {
        setState(message.payload);
      }
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  const handleStart = async (newConfig: ExtensionConfig) => {
    setConfig(newConfig);
    const response = await chrome.runtime.sendMessage({
      type: 'START_MONITORING',
      payload: newConfig,
    });
    if (response) {
      setState(response);
    }
  };

  const handleStop = async () => {
    const response = await chrome.runtime.sendMessage({ type: 'STOP_MONITORING' });
    if (response) {
      setState(response);
    }
  };

  if (loading) {
    return <div style={styles.container}>Loading...</div>;
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Website Availability Monitor</h1>
      <ConfigForm
        config={config}
        isMonitoring={state.isMonitoring}
        onStart={handleStart}
        onStop={handleStop}
      />
      {state.isMonitoring && <StatusDisplay state={state} />}
    </div>
  );
}
