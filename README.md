# 🤝 LLM Consensus Builder

A web application that forms consensus from multiple LLMs by having them review and rank each other's responses, with a chairman LLM creating the final consolidated output.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.8+-blue.svg)
![React](https://img.shields.io/badge/react-18.2+-blue.svg)

## ✨ Features

- **Multi-LLM Consensus** - Query 3 different LLMs simultaneously and synthesize their responses
- **File Upload Support** - Attach text files, images, JSON, CSV, and more for analysis
- **Vision Model Support** - Automatic image analysis with Claude, GPT-4V, and other vision models
- **Peer Review System** - Each LLM ranks all responses for quality and accuracy
- **Chairman Synthesis** - A designated LLM creates the final consensus from all inputs
- **Parallel Processing** - All LLM requests run concurrently for 3x faster results
- **Multiple Providers** - Support for OpenRouter, Ollama, and AWS Bedrock
- **Configurable Endpoints** - Easy setup with API key management and model discovery
- **Beautiful UI** - Clean, modern interface with tabbed results view
- **Retry Logic** - Automatic retry with exponential backoff for rate limits
- **Free Models** - Filter for free models on OpenRouter

## 🏗️ Architecture

```
┌─────────────┐
│   Prompt    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Step 1: Initial Responses (Parallel)│
│  ┌──────┐  ┌──────┐  ┌──────┐      │
│  │ LLM1 │  │ LLM2 │  │ LLM3 │      │
│  └──────┘  └──────┘  └──────┘      │
└─────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Step 2: Rankings (Parallel)        │
│  Each LLM ranks all 3 responses     │
└─────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Step 3: Chairman Synthesis         │
│  Creates final consensus            │
└─────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- Node.js 16+
- npm or yarn

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
python3 main.py
```

Backend runs on `http://localhost:8000`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

## 🔧 Configuration

### 1. Configure Endpoints

Click "⚙️ Configure Endpoints" in the app to set up your LLM providers:

#### OpenRouter (Free & Paid Models)
- **Type**: OpenAI Compatible
- **URL**: `https://openrouter.ai/api/v1`
- **API Key**: Get from [openrouter.ai/keys](https://openrouter.ai/keys)
- **Free Models**: Enable "Only show free models" checkbox
- **Popular Free Models**:
  - `meta-llama/llama-3.2-3b-instruct:free`
  - `mistralai/mistral-7b-instruct:free`
  - `google/gemma-2-9b-it:free`

#### Ollama (Local)
- **Type**: Ollama
- **URL**: `http://localhost:11434`
- **Setup**: 
  ```bash
  # Install Ollama
  curl -fsSL https://ollama.ai/install.sh | sh
  
  # Pull models
  ollama pull llama3.2
  ollama pull mistral
  ollama pull gemma2
  ```

#### AWS Bedrock
- **Type**: AWS Bedrock
- **Region**: Select from dropdown (e.g., US East)
- **API Key**: Get from AWS Console → Bedrock → API Keys
- **Setup Guide**: See [BEDROCK_SETUP.md](BEDROCK_SETUP.md)
- **Recommended Profiles**:
  - `us.anthropic.claude-3-5-sonnet-20241022-v2:0`
  - `us.anthropic.claude-3-5-haiku-20241022-v1:0`
  - `us.amazon.nova-pro-v1:0`

### 2. Select Participants & Chairman

In the configuration page:
1. Choose 3 participant LLMs (can mix providers)
2. Select a chairman LLM
3. Save configuration

### 3. Generate Consensus

1. Enter your prompt
2. (Optional) Upload a file to analyze:
   - **Text files**: .txt, .md, .json, .csv - Content included in prompt
   - **Images**: .png, .jpg, .jpeg - Sent to vision-capable models
   - **Documents**: .pdf, .doc, .docx - Metadata included
3. Click "Generate Consensus"
4. View results in tabs:
   - **Initial Responses** - See what each LLM said
   - **Rankings** - How each LLM ranked the responses
   - **Final Consensus** - The chairman's synthesis

## 📊 Example Use Cases

- **Research Questions** - Get multiple perspectives on complex topics
- **Code Review** - Upload code files and have multiple LLMs review and rank solutions
- **Image Analysis** - Upload images for multi-model visual analysis and consensus
- **Document Analysis** - Upload text files, JSON, CSV for comprehensive review
- **Content Creation** - Generate and refine content through consensus
- **Decision Making** - Evaluate options from multiple AI viewpoints
- **Fact Checking** - Cross-reference information across models

## 🎯 Example Configuration

**Diverse Provider Mix:**
- Participant 1: OpenRouter (Claude 3.5 Haiku - fast, cheap)
- Participant 2: Ollama (Llama 3.2 - local, private)
- Participant 3: Bedrock (Nova Pro - powerful)
- Chairman: OpenRouter (GPT-4 - synthesis)

**All Free:**
- Participant 1: OpenRouter (llama-3.2-3b-instruct:free)
- Participant 2: OpenRouter (mistral-7b-instruct:free)
- Participant 3: Ollama (gemma2)
- Chairman: OpenRouter (llama-3.2-3b-instruct:free)

## 🛠️ Technical Details

### Backend (Python/FastAPI)
- **Framework**: FastAPI
- **Async**: Full async/await for parallel requests
- **Retry Logic**: Exponential backoff for rate limits
- **Error Handling**: Graceful degradation on failures
- **Logging**: Detailed debug output

### Frontend (React/Vite)
- **Framework**: React 18
- **Build Tool**: Vite
- **State**: React hooks
- **Storage**: localStorage for config persistence
- **Styling**: Custom CSS with dark theme

### Performance
- **Parallel Execution**: 3x faster than sequential
- **Typical Time**: 30-60 seconds (vs 2-4 minutes sequential)
- **Retry Strategy**: Up to 5 attempts for chairman with increasing backoff

## 📝 API Endpoints

### POST `/api/consensus`
Generate consensus from multiple LLMs

**Request:**
```json
{
  "prompt": "Your question here",
  "participants": [
    {"endpoint": "...", "model": "...", "api_key": "...", "type": "openai"},
    {"endpoint": "...", "model": "...", "api_key": "...", "type": "ollama"},
    {"endpoint": "...", "model": "...", "api_key": "...", "type": "bedrock"}
  ],
  "chairman": {"endpoint": "...", "model": "...", "api_key": "..."},
  "file": {
    "name": "example.txt",
    "type": "text/plain",
    "content": "file content or base64 data"
  }
}
```

**Response:**
```json
{
  "prompt": "...",
  "responses": [...],
  "rankings": [...],
  "final_output": "..."
}
```

### POST `/api/models`
Discover available models for an endpoint

### GET `/api/health`
Health check endpoint

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Built with FastAPI and React
- Supports OpenRouter, Ollama, and AWS Bedrock
- Inspired by the need for multi-perspective AI analysis

## 📚 Additional Documentation

- [AWS Bedrock Setup Guide](BEDROCK_SETUP.md)
- [API Documentation](http://localhost:8000/docs) (when backend is running)

## 🔒 Security

This application implements multiple security layers:

- **CORS Protection** - Restricted origins
- **Security Headers** - XSS, clickjacking, MIME sniffing protection
- **Rate Limiting** - 100 requests per 15 minutes per IP
- **Input Validation** - All inputs validated with Pydantic
- **Session Storage Option** - API keys can auto-clear on browser close
- **No Server-Side Storage** - API keys never stored on backend

See [SECURITY.md](SECURITY.md) for detailed security information.

### Environment Configuration

```bash
# Backend configuration
cp backend/.env.example backend/.env
# Edit ALLOWED_ORIGINS for your domain
```

## 🐛 Troubleshooting

**Backend won't start:**
- Check Python version: `python3 --version` (need 3.8+)
- Install dependencies: `pip install -r requirements.txt`

**Frontend won't start:**
- Check Node version: `node --version` (need 16+)
- Clear cache: `rm -rf node_modules && npm install`

**Ollama not working:**
- Check if running: `ollama list`
- Start service: `ollama serve`

**Rate limits:**
- The app automatically retries with exponential backoff
- Consider using multiple providers to distribute load
- Use local Ollama models to avoid rate limits

**Empty responses:**
- Check API keys are valid
- Verify model names are correct
- Check backend logs for detailed errors

## 🔮 Future Enhancements

- [x] File upload support (text, images, documents)
- [x] Vision model support for image analysis
- [ ] Support for more LLM providers (Anthropic, OpenAI direct, etc.)
- [ ] Custom ranking criteria
- [ ] Export results to markdown/PDF
- [ ] Conversation history
- [ ] Batch processing
- [ ] Cost tracking
- [ ] Model performance analytics
- [ ] PDF text extraction
- [ ] Audio file transcription and analysis
