# Contributing to LLM Consensus Builder

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/llm-consensus.git`
3. Create a branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test your changes
6. Commit: `git commit -m "Add your feature"`
7. Push: `git push origin feature/your-feature-name`
8. Open a Pull Request

## Development Setup

### Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python3 main.py
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Code Style

### Python
- Follow PEP 8
- Use type hints where appropriate
- Add docstrings to functions
- Keep functions focused and small

### JavaScript/React
- Use functional components with hooks
- Follow React best practices
- Use meaningful variable names
- Add comments for complex logic

## Testing

Before submitting a PR:
1. Test with multiple LLM providers
2. Test error handling (invalid API keys, rate limits, etc.)
3. Test the UI in different browsers
4. Check console for errors

## Pull Request Guidelines

- Provide a clear description of the changes
- Reference any related issues
- Include screenshots for UI changes
- Update documentation if needed
- Keep PRs focused on a single feature/fix

## Adding New LLM Providers

To add support for a new provider:

1. Update `backend/consensus.py`:
   - Add provider detection in `call_llm()`
   - Add request format for the provider
   - Add response parsing logic

2. Update `frontend/src/ConfigPage.jsx`:
   - Add provider type to dropdown
   - Add any provider-specific UI elements

3. Update `backend/main.py`:
   - Add model discovery logic in `/api/models`

4. Update documentation:
   - Add setup instructions to README
   - Add example configuration

## Feature Requests

Open an issue with:
- Clear description of the feature
- Use case / motivation
- Proposed implementation (optional)

## Bug Reports

Open an issue with:
- Description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Environment (OS, Python version, Node version)
- Logs/screenshots if applicable

## Questions

Feel free to open an issue for questions or join discussions.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
