import { useState, useEffect } from 'react'
import ConfigPage from './ConfigPage'

function App() {
  const [showConfig, setShowConfig] = useState(false)
  const [config, setConfig] = useState(null)
  const [prompt, setPrompt] = useState('')
  const [uploadedFile, setUploadedFile] = useState(null)
  const [fileContent, setFileContent] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('responses')

  useEffect(() => {
    // Check if we should use session storage
    const useSession = localStorage.getItem('llm-consensus-use-session') === 'true'
    const storage = useSession ? sessionStorage : localStorage
    
    const savedConfig = storage.getItem('llm-consensus-config')
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig))
    }
  }, [])

  const buildLLMConfig = (selection) => {
    const endpoint = config?.endpoints?.find(e => e.id === selection.endpointId)
    if (!endpoint) return null
    
    let fullEndpoint
    if (endpoint.type === 'bedrock') {
      fullEndpoint = endpoint.url || 'bedrock://region=us-east-1'
    } else if (endpoint.type === 'ollama') {
      fullEndpoint = `${endpoint.url}/api/generate`
    } else {
      fullEndpoint = `${endpoint.url}/chat/completions`
    }
    
    return {
      endpoint: fullEndpoint,
      model: selection.model,
      api_key: endpoint.apiKey,
      type: endpoint.type
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploadedFile(file)
    
    // Read file content
    const reader = new FileReader()
    reader.onload = (event) => {
      setFileContent({
        name: file.name,
        type: file.type,
        content: event.target.result
      })
    }
    
    // Read as text for text files, base64 for others
    if (file.type.startsWith('text/') || file.type === 'application/json') {
      reader.readAsText(file)
    } else {
      reader.readAsDataURL(file)
    }
  }

  const removeFile = () => {
    setUploadedFile(null)
    setFileContent(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!config?.participants || !config?.chairman) {
      setError('Please configure participants and chairman in settings')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)
    setActiveTab('responses')

    try {
      const participantConfigs = config.participants.map(p => buildLLMConfig(p)).filter(Boolean)
      const chairmanConfig = buildLLMConfig(config.chairman)

      if (participantConfigs.length !== 3 || !chairmanConfig) {
        throw new Error('Please configure all participants and chairman in settings')
      }

      const requestBody = { 
        prompt, 
        participants: participantConfigs, 
        chairman: chairmanConfig 
      }

      // Add file content if available
      if (fileContent) {
        requestBody.file = fileContent
      }

      const response = await fetch('http://localhost:8000/api/consensus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log('Received consensus data:', data)
      console.log('Responses:', data.responses)
      console.log('Rankings:', data.rankings)
      console.log('Final output:', data.final_output)
      setResult(data)
    } catch (err) {
      console.error('Error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (showConfig) {
    return (
      <ConfigPage
        initialConfig={config}
        onSave={(newConfig, useSessionStorage) => {
          setConfig(newConfig)
          const storage = useSessionStorage ? sessionStorage : localStorage
          storage.setItem('llm-consensus-config', JSON.stringify(newConfig))
          setShowConfig(false)
        }}
        onCancel={() => setShowConfig(false)}
      />
    )
  }

  const getEndpointName = (endpointId) => {
    return config?.endpoints?.find(e => e.id === endpointId)?.name || 'Unknown'
  }

  const formatText = (text) => {
    if (!text) return ''
    
    // Simple markdown-like formatting
    let formatted = text
      // Headers
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Code blocks
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
    
    return formatted
  }

  return (
    <div className="container">
      <div className="header">
        <h1>🤝 LLM Consensus Builder</h1>
        <button onClick={() => setShowConfig(true)} className="btn-secondary">
          ⚙️ Configure Endpoints
        </button>
      </div>

      {!config?.participants && (
        <div className="warning">
          Please configure participants and chairman in settings
        </div>
      )}

      {config?.participants && (
        <div className="config-section">
          <h2>Current Configuration</h2>
          <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
            <div>Participants: {config.participants.map((p, i) => 
              `${i + 1}. ${getEndpointName(p.endpointId)} (${p.model})`
            ).join(' • ')}</div>
            <div>Chairman: {getEndpointName(config.chairman?.endpointId)} ({config.chairman?.model})</div>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="config-section">
          <div className="form-group">
            <label>Your Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your question or prompt..."
              required
            />
          </div>

          <div className="form-group">
            <label>Upload File (Optional)</label>
            <div className="file-upload-area">
              {!uploadedFile ? (
                <label className="file-upload-label">
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                    accept=".txt,.md,.json,.csv,.pdf,.doc,.docx,.png,.jpg,.jpeg"
                  />
                  <div className="file-upload-placeholder">
                    📎 Click to upload or drag file here
                    <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                      Supports: text, markdown, JSON, CSV, PDF, images
                    </div>
                  </div>
                </label>
              ) : (
                <div className="file-uploaded">
                  <div className="file-info">
                    <span>📄 {uploadedFile.name}</span>
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                      ({(uploadedFile.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="btn-remove-file"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading || !config?.participants}>
          {loading ? 'Building Consensus...' : 'Generate Consensus'}
        </button>
      </form>

      {error && <div className="error">Error: {error}</div>}

      {loading && <div className="loading">Processing... This may take a minute.</div>}

      {result && (
        <div className="results">
          <div className="tabs">
            <button 
              className={`tab ${activeTab === 'responses' ? 'active' : ''}`}
              onClick={() => setActiveTab('responses')}
            >
              Initial Responses
            </button>
            <button 
              className={`tab ${activeTab === 'rankings' ? 'active' : ''}`}
              onClick={() => setActiveTab('rankings')}
            >
              Rankings
            </button>
            <button 
              className={`tab ${activeTab === 'consensus' ? 'active' : ''}`}
              onClick={() => setActiveTab('consensus')}
            >
              Final Consensus
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'responses' && (
              <div className="cards-grid">
                {result.responses.map((r, i) => (
                  <div key={i} className="card">
                    <div className="card-header">
                      <strong>Participant {r.participant + 1}</strong>
                      <span className="card-badge">
                        {getEndpointName(config.participants[r.participant]?.endpointId)}
                      </span>
                    </div>
                    <div className="card-body">
                      <div 
                        className="formatted-text" 
                        dangerouslySetInnerHTML={{ __html: formatText(r.response) }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'rankings' && (
              <div className="cards-grid">
                {result.rankings.map((r, i) => (
                  <div key={i} className="card">
                    <div className="card-header">
                      <strong>Participant {r.participant + 1} Rankings</strong>
                      <span className="card-badge">
                        {getEndpointName(config.participants[r.participant]?.endpointId)}
                      </span>
                    </div>
                    <div className="card-body">
                      <div 
                        className="formatted-text" 
                        dangerouslySetInnerHTML={{ __html: formatText(r.ranking) }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'consensus' && (
              <div className="final-output">
                <h3>✨ Final Consensus</h3>
                <div 
                  className="formatted-text consensus-text" 
                  dangerouslySetInnerHTML={{ __html: formatText(result.final_output) }}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default App
