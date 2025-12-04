from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
import httpx
from consensus import ConsensusEngine

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LLMConfig(BaseModel):
    endpoint: str
    model: str
    api_key: Optional[str] = None
    type: Optional[str] = "openai"  # openai, ollama, bedrock

class ConsensusRequest(BaseModel):
    prompt: str
    participants: List[LLMConfig]
    chairman: LLMConfig

class ModelsRequest(BaseModel):
    endpoint_url: str
    api_key: Optional[str] = None
    type: str = "openai"
    free_only: bool = False

@app.post("/api/consensus")
async def generate_consensus(request: ConsensusRequest):
    if len(request.participants) != 3:
        raise HTTPException(status_code=400, detail="Exactly 3 participants required")
    
    engine = ConsensusEngine()
    result = await engine.run(request.prompt, request.participants, request.chairman)
    return result

@app.post("/api/models")
async def get_models(request: ModelsRequest):
    """Fetch available models from an endpoint"""
    print(f"DEBUG: Received request - endpoint_url: {request.endpoint_url}, type: {request.type}, free_only: {request.free_only}")
    try:
        if request.type == "bedrock":
            # AWS Bedrock models discovery
            if not request.api_key:
                raise HTTPException(status_code=400, detail="API key required for Bedrock")
            
            # Extract region from endpoint_url
            region = "us-east-1"
            if "region=" in request.endpoint_url:
                region = request.endpoint_url.split("region=")[1].split("&")[0]
            
            print(f"DEBUG: Fetching Bedrock inference profiles for region: {region}")
            
            # Bedrock list inference profiles endpoint
            endpoint = f"https://bedrock.{region}.amazonaws.com/inference-profiles"
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {request.api_key}"
            }
            
            profiles = []
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.get(endpoint, headers=headers)
                    print(f"DEBUG: Bedrock profiles response status: {response.status_code}")
                    
                    if response.status_code >= 400:
                        try:
                            error_body = response.json()
                            print(f"DEBUG: Bedrock error: {error_body}")
                        except:
                            print(f"DEBUG: Bedrock error text: {response.text[:500]}")
                    
                    response.raise_for_status()
                    data = response.json()
                    
                    # Extract inference profile IDs from response
                    if "inferenceProfileSummaries" in data:
                        for profile in data["inferenceProfileSummaries"]:
                            profile_id = profile.get("inferenceProfileId") or profile.get("inferenceProfileArn")
                            profile_name = profile.get("inferenceProfileName", "")
                            if profile_id:
                                # Include profile name in display if available
                                display = f"{profile_id}"
                                if profile_name:
                                    display = f"{profile_name} ({profile_id})"
                                profiles.append(profile_id)
                    
                    print(f"DEBUG: Found {len(profiles)} Bedrock inference profiles")
            except Exception as e:
                print(f"DEBUG: Bedrock API call failed: {str(e)}, returning default profiles")
            
            # If API call fails or returns nothing, return common inference profiles
            if not profiles:
                profiles = [
                    # Cross-region inference profiles (recommended)
                    'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
                    'us.anthropic.claude-3-5-haiku-20241022-v1:0',
                    'us.anthropic.claude-3-opus-20240229-v1:0',
                    'us.anthropic.claude-3-sonnet-20240229-v1:0',
                    'us.anthropic.claude-3-haiku-20240307-v1:0',
                    'us.meta.llama3-3-70b-instruct-v1:0',
                    'us.meta.llama3-2-90b-instruct-v1:0',
                    'us.meta.llama3-2-11b-instruct-v1:0',
                    'us.mistral.mistral-large-2407-v1:0',
                    'us.amazon.nova-pro-v1:0',
                    'us.amazon.nova-lite-v1:0',
                    'us.amazon.nova-micro-v1:0',
                    # Region-specific model IDs (fallback)
                    'anthropic.claude-3-5-sonnet-20241022-v2:0',
                    'anthropic.claude-3-5-haiku-20241022-v1:0',
                    'meta.llama3-3-70b-instruct-v1:0',
                    'amazon.titan-text-premier-v1:0'
                ]
            
            return {"models": sorted(profiles)}
            
        elif request.type == "ollama":
            # Ollama models endpoint
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(f"{request.endpoint_url}/api/tags")
                response.raise_for_status()
                data = response.json()
                models = [model["name"] for model in data.get("models", [])]
                return {"models": models}
        else:
            # OpenAI-compatible models endpoint
            headers = {"Content-Type": "application/json"}
            if request.api_key:
                headers["Authorization"] = f"Bearer {request.api_key}"
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    f"{request.endpoint_url}/models",
                    headers=headers
                )
                response.raise_for_status()
                data = response.json()
                
                # Handle different response formats
                if "data" in data:
                    models_data = data["data"]
                    models = [model["id"] for model in models_data]
                    print(f"DEBUG: Total models before filter: {len(models)}")
                    
                    # Filter for free models if requested (OpenRouter specific)
                    if request.free_only and "openrouter" in request.endpoint_url:
                        print(f"DEBUG: Filtering for free models...")
                        models = [m for m in models if m.endswith(":free")]
                        print(f"DEBUG: Free models found: {len(models)}")
                        print(f"DEBUG: Sample free models: {models[:5]}")
                elif "models" in data:
                    models = data["models"]
                else:
                    models = []
                
                return {"models": models}
    except Exception as e:
        print(f"DEBUG: Error occurred: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
