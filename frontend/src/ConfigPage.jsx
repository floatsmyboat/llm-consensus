import { useState, useEffect } from 'react'

function ConfigPage({ onSave, onCancel, initialConfig }) {
  const [endpoints, setEndpoints] = useState(initialConfig?.endpoints || [
    {
      id: 'openrouter',
      name: 'OpenRouter',
      url: 'https://openrouter.ai/api/v1',
      apiKey: '',
      type: 'openai',
      freeOnly: false
    },
    {
      id: 'ollama',
      name: 'Ollama (Local)',
      url: 'http://localhost:11434',
      apiKey: '',
      type: 'ollama',
      freeOnly: false
    }
  ])
  
  const [loadingModels, setLoadingModels] = useState({})
  const [availableModels, setAvailableModels] = useState(
    initialConfig?.endpoints?.reduce((acc, endpoint, index) => {
      if (endpoint.models) {
        acc[index] = endpoint.models
      }
      return acc
    }, {}) || {}
  )
  const [error, setError] = useState(null)

  const addEndpoint = () => {
    setEndpoints([...endpoints, {
      id: `endpoint-${Date.now()}`,
      name: '',
      url: '',
      apiKey: '',
      type: 'openai',
      freeOnly: false
    }])
  }

  const updateEndpoint = (index, field, value) => {
    const updated = [...endpoints]
    updated[index][field] = value
    setEndpoints(updated)
  }

  const removeEndpoint = (index) => {
    setEndpoints(endpoints.filter((_, i) => i !== index))
  }

  const fetchModels = async (endpoint, index) => {
    setLoadingModels({ ...loadingModels, [index]: true })
    setError(null)

    const requestBody = {
      endpoint_url: endpoint.url,
      api_key: endpoint.apiKey,
      type: endpoint.type,
      free_only: endpoint.freeOnly || false
    }
    console.log('Fetching models with:', requestBody)

    try {
      const response = await fetch('http://localhost:8000/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`)
      }

      const data = await response.json()
      const models = data.models
      setAvailableModels({ ...availableModels, [index]: models })
      
      // Store models in endpoint config
      const updated = [...endpoints]
      updated[index].models = models
      setEndpoints(updated)
    } catch (err) {
      setError(`Error fetching models for ${endpoint.name}: ${err.message}`)
    } finally {
      setLoadingModels({ ...loadingModels, [index]: false })
    }
  }

  const [participants, setParticipants] = useState(initialConfig?.participants || [
    { endpointId: '', model: '' },
    { endpointId: '', model: '' },
    { endpointId: '', model: '' }
  ])
  const [chairman, setChairman] = useState(initialConfig?.chairman || { endpointId: '', model: '' })

  const updateParticipant = (index, field, value) => {
    const updated = [...participants]
    updated[index][field] = value
    setParticipants(updated)
  }

  const updateChairman = (field, value) => {
    setChairman({ ...chairman, [field]: value })
  }

  const getModelsForEndpoint = (endpointId) => {
    const endpoint = endpoints.find(e => e.id === endpointId)
    return endpoint?.models || []
  }

  const [useSessionStorage, setUseSessionStorage] = useState(
    localStorage.getItem('llm-consensus-use-session') === 'true'
  )

  const handleSave = () => {
    const config = { 
      endpoints: endpoints.map((endpoint, index) => ({
        ...endpoint,
        models: availableModels[index] || endpoint.models || []
      })),
      participants,
      chairman
    }
    
    // Save storage preference
    localStorage.setItem('llm-consensus-use-session', useSessionStorage.toString())
    
    onSave(config, useSessionStorage)
  }

  return (
    <div className="config-page">
      <div className="config-header">
        <h1>⚙️ Configuration</h1>
        <div className="config-actions">
          <button onClick={onCancel} className="btn-secondary">Cancel</button>
          <button onClick={handleSave}>Save Configuration</button>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="config-section" style={{ marginBottom: '1.5rem' }}>
        <h2>Security Settings</h2>
        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={useSessionStorage}
              onChange={(e) => setUseSessionStorage(e.target.checked)}
              style={{ width: 'auto', cursor: 'pointer' }}
            />
            Use session storage (more secure - clears API keys when browser closes)
          </label>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.5rem', marginLeft: '1.5rem' }}>
            {useSessionStorage 
              ? '🔒 API keys will be cleared when you close the browser tab'
              : '💾 API keys will persist between sessions (less secure on shared computers)'}
          </p>
        </div>
      </div>

      <div className="endpoints-list">
        {endpoints.map((endpoint, index) => (
          <div key={endpoint.id} className="endpoint-card">
            <div className="endpoint-header">
              <h3>Endpoint {index + 1}</h3>
              {endpoints.length > 1 && (
                <button 
                  onClick={() => removeEndpoint(index)}
                  className="btn-danger-small"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Name</label>
                <input
                  value={endpoint.name}
                  onChange={(e) => updateEndpoint(index, 'name', e.target.value)}
                  placeholder="e.g., OpenRouter, Ollama"
                />
              </div>

              <div className="form-group">
                <label>Type</label>
                <select
                  value={endpoint.type}
                  onChange={(e) => updateEndpoint(index, 'type', e.target.value)}
                >
                  <option value="openai">OpenAI Compatible</option>
                  <option value="ollama">Ollama</option>
                  <option value="bedrock">AWS Bedrock</option>
                </select>
              </div>

              {endpoint.type !== 'bedrock' && (
                <div className="form-group">
                  <label>Base URL</label>
                  <input
                    value={endpoint.url}
                    onChange={(e) => updateEndpoint(index, 'url', e.target.value)}
                    placeholder="https://api.example.com/v1"
                  />
                </div>
              )}

              {endpoint.type === 'bedrock' && (
                <div className="form-group">
                  <label>AWS Region</label>
                  <select
                    value={endpoint.url || 'bedrock://region=us-east-1'}
                    onChange={(e) => updateEndpoint(index, 'url', e.target.value)}
                  >
                    <option value="bedrock://region=us-east-1">US East (N. Virginia)</option>
                    <option value="bedrock://region=us-west-2">US West (Oregon)</option>
                    <option value="bedrock://region=eu-west-1">Europe (Ireland)</option>
                    <option value="bedrock://region=eu-central-1">Europe (Frankfurt)</option>
                    <option value="bedrock://region=ap-southeast-1">Asia Pacific (Singapore)</option>
                    <option value="bedrock://region=ap-northeast-1">Asia Pacific (Tokyo)</option>
                  </select>
                </div>
              )}

              <div className="form-group">
                <label>{endpoint.type === 'bedrock' ? 'Bedrock API Key' : 'API Key (optional)'}</label>
                <input
                  type="password"
                  value={endpoint.apiKey}
                  onChange={(e) => updateEndpoint(index, 'apiKey', e.target.value)}
                  placeholder={endpoint.type === 'bedrock' ? 'Get from AWS Console → Bedrock → API Keys' : 'sk-...'}
                />
              </div>
            </div>

            {endpoint.url?.includes('openrouter.ai') && (
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={endpoint.freeOnly || false}
                    onChange={(e) => updateEndpoint(index, 'freeOnly', e.target.checked)}
                    style={{ width: 'auto', cursor: 'pointer' }}
                  />
                  Only show free models
                </label>
              </div>
            )}

            <div className="model-discovery">
              <button
                onClick={() => fetchModels(endpoint, index)}
                disabled={
                  loadingModels[index] || 
                  (endpoint.type === 'bedrock' && !endpoint.apiKey) ||
                  (endpoint.type !== 'bedrock' && !endpoint.url)
                }
                className="btn-secondary"
              >
                {loadingModels[index] ? 'Loading...' : 'Discover Models'}
              </button>

              {availableModels[index] && (
                <div className="models-list">
                  <p className="models-count">
                    Found {availableModels[index].length} models
                  </p>
                  <div className="models-scroll">
                    {availableModels[index].map((model, i) => (
                      <div key={i} className="model-item">
                        {model}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <button onClick={addEndpoint} className="btn-add">
        + Add Endpoint
      </button>

      <div className="config-section" style={{ marginTop: '2rem' }}>
        <h2>Consensus Participants</h2>
        {participants.map((p, i) => (
          <div key={i} className="form-grid" style={{ marginBottom: '1rem' }}>
            <div className="form-group">
              <label>Participant {i + 1} Endpoint</label>
              <select
                value={p.endpointId}
                onChange={(e) => updateParticipant(i, 'endpointId', e.target.value)}
              >
                <option value="">Select endpoint...</option>
                {endpoints.map(endpoint => (
                  <option key={endpoint.id} value={endpoint.id}>
                    {endpoint.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Model</label>
              <select
                value={p.model}
                onChange={(e) => updateParticipant(i, 'model', e.target.value)}
                disabled={!p.endpointId}
              >
                <option value="">Select model...</option>
                {getModelsForEndpoint(p.endpointId).map(model => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>

      <div className="config-section">
        <h2>Chairman</h2>
        <div className="form-grid">
          <div className="form-group">
            <label>Endpoint</label>
            <select
              value={chairman.endpointId}
              onChange={(e) => updateChairman('endpointId', e.target.value)}
            >
              <option value="">Select endpoint...</option>
              {endpoints.map(endpoint => (
                <option key={endpoint.id} value={endpoint.id}>
                  {endpoint.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Model</label>
            <select
              value={chairman.model}
              onChange={(e) => updateChairman('model', e.target.value)}
              disabled={!chairman.endpointId}
            >
              <option value="">Select model...</option>
              {getModelsForEndpoint(chairman.endpointId).map(model => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConfigPage
