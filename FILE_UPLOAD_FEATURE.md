# File Upload Feature

## Overview
Added comprehensive file upload functionality to the LLM Consensus Builder, allowing users to attach files for analysis by all LLM providers.

## Features Added

### 1. Frontend (React)
- **File Upload UI Component**
  - Drag-and-drop style upload area
  - File type restrictions (.txt, .md, .json, .csv, .pdf, .doc, .docx, .png, .jpg, .jpeg)
  - File preview with name and size
  - Remove file button
  - Styled with dark theme matching existing UI

- **File Processing**
  - Text files read as plain text
  - Images read as base64 data URLs
  - Binary files read as base64
  - File metadata (name, type, content) sent to backend

### 2. Backend (Python/FastAPI)
- **API Updates**
  - Added `FileContent` model with name, type, and content fields
  - Updated `ConsensusRequest` to accept optional file parameter
  - File content passed through to consensus engine

### 3. Consensus Engine
- **File Handling**
  - Text files: Content appended to prompt
  - Images: Sent separately to vision-capable models
  - Binary files: Metadata included in prompt

- **Vision Model Support**
  - **Claude (Bedrock)**: Images sent using Anthropic's vision format
  - **OpenRouter**: Images sent using OpenAI vision format
  - **Ollama**: Images sent using Ollama's image format
  - Automatic detection and proper formatting per provider

## Supported File Types

### Text Files (Included in Prompt)
- `.txt` - Plain text
- `.md` - Markdown
- `.json` - JSON data
- `.csv` - CSV data

### Images (Vision Models)
- `.png` - PNG images
- `.jpg` / `.jpeg` - JPEG images
- Automatically sent to vision-capable models
- Falls back to text description for non-vision models

### Documents (Metadata)
- `.pdf` - PDF documents
- `.doc` / `.docx` - Word documents
- File type and metadata included in prompt

## Usage

1. Enter your prompt as usual
2. Click the file upload area or drag a file
3. File is automatically processed and attached
4. Click "Generate Consensus"
5. All LLMs receive the file content/image
6. Results show analysis from all models

## Example Use Cases

### Code Review
```
Prompt: "Review this code for bugs and improvements"
File: script.py
Result: Multiple LLMs analyze the code and provide consensus
```

### Image Analysis
```
Prompt: "What's in this image? Describe in detail."
File: photo.jpg
Result: Vision models (Claude, GPT-4V) analyze and consensus is formed
```

### Data Analysis
```
Prompt: "Analyze this data and provide insights"
File: data.csv
Result: LLMs review the CSV data and provide analysis
```

### Document Review
```
Prompt: "Summarize the key points"
File: document.txt
Result: Multiple perspectives on document content
```

## Technical Implementation

### Frontend Flow
1. User selects file
2. FileReader API reads file content
3. Text files → plain text
4. Images → base64 data URL
5. File object stored in state
6. Sent with consensus request

### Backend Flow
1. Receive file in request body
2. Extract name, type, content
3. Pass to consensus engine
4. Engine determines handling based on type

### Consensus Engine Flow
1. Check file type
2. If image → extract base64, pass to vision models
3. If text → append to prompt
4. If binary → include metadata
5. All participants receive appropriate format
6. Rankings and consensus proceed normally

## Vision Model Support

### Supported Models
- **Claude 3.5 Sonnet** (Bedrock)
- **Claude 3 Opus/Sonnet/Haiku** (Bedrock)
- **GPT-4 Vision** (OpenRouter)
- **Gemini Pro Vision** (OpenRouter)
- **LLaVA** (Ollama)

### Format Handling
Each provider has specific image format requirements:
- **Bedrock/Claude**: Base64 with media type in structured format
- **OpenRouter**: Data URL in image_url field
- **Ollama**: Base64 in images array

The engine automatically detects the provider and formats accordingly.

## Security Considerations

- File size limits enforced by browser
- File type validation on frontend
- No server-side file storage
- Files processed in memory only
- Base64 encoding for safe transmission

## Future Enhancements

- [ ] PDF text extraction
- [ ] Audio file transcription
- [ ] Multiple file upload
- [ ] File size limits
- [ ] Progress indicators for large files
- [ ] File preview before upload
- [ ] Support for more document formats
