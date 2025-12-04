# AWS Bedrock Setup Guide

## Prerequisites

1. **Create Bedrock API Key**:
   - Go to AWS Console → Bedrock → API Keys
   - Click "Create API key"
   - Give it a name and select permissions
   - Copy the API key (you won't be able to see it again!)
   - Documentation: https://docs.aws.amazon.com/bedrock/latest/userguide/api-keys-how.html

2. **Enable Bedrock Models**:
   - Go to AWS Console → Bedrock → Model access
   - Request access to the models you want to use
   - Wait for approval (usually instant for most models)

## Configuration in App

1. Click "⚙️ Configure Endpoints"
2. Add a new endpoint or edit existing
3. Set Type to "AWS Bedrock"
4. Select AWS Region from dropdown
5. Paste your Bedrock API Key
6. Click "Discover Models" to fetch available inference profiles
7. Select an inference profile:
   - Claude 3.5 Sonnet: `us.anthropic.claude-3-5-sonnet-20241022-v2:0`
   - Claude 3.5 Haiku: `us.anthropic.claude-3-5-haiku-20241022-v1:0`
   - Llama 3.3 70B: `us.meta.llama3-3-70b-instruct-v1:0`
   - Amazon Nova Pro: `us.amazon.nova-pro-v1:0`

## Inference Profiles vs Model IDs

AWS Bedrock uses **inference profiles** for better routing and availability:
- **Cross-region profiles** (recommended): `us.anthropic.claude-3-5-sonnet-20241022-v2:0`
  - Automatically routes to available regions
  - Better reliability and performance
- **Direct model IDs**: `anthropic.claude-3-5-sonnet-20241022-v2:0`
  - Region-specific
  - Use if you need to stay in a specific region

## Supported Model Families

- **Anthropic Claude** (3, 3.5, Opus, Sonnet, Haiku)
- **Meta Llama** (3.2, 3.3)
- **Mistral** (Large, Mixtral)
- **Amazon Nova** (Pro, Lite, Micro)
- **Amazon Titan** (Text Express, Premier)

## Pricing

Bedrock charges per token. Check current pricing:
https://aws.amazon.com/bedrock/pricing/

Most models are very affordable for testing and moderate use.

## Notes

- No boto3 or AWS CLI installation required
- API keys are simpler than IAM credentials
- Keys can be rotated and managed in AWS Console
- Each key can have specific permissions and rate limits
- Cross-region inference profiles provide better availability
