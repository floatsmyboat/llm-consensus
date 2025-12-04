import httpx
import json
import asyncio
from typing import List, Dict, Any, Union

class ConsensusEngine:
    async def call_bedrock(self, model: str, prompt: str, api_key: str, region: str = "us-east-1", max_retries: int = 3) -> str:
        """Call AWS Bedrock using API key authentication with inference profiles"""
        print(f"DEBUG: Calling AWS Bedrock - inference profile/model: {model}, region: {region}")
        
        # Bedrock API endpoint - use inference profile if it starts with region prefix, otherwise use model ID
        if model.startswith(('us.', 'eu.', 'ap.')):
            # Cross-region inference profile
            endpoint = f"https://bedrock-runtime.{region}.amazonaws.com/model/{model}/invoke"
            print(f"DEBUG: Using cross-region inference profile")
        else:
            # Direct model ID
            endpoint = f"https://bedrock-runtime.{region}.amazonaws.com/model/{model}/invoke"
            print(f"DEBUG: Using direct model ID")
        
        # Format request based on model family (check both profile and model name)
        model_lower = model.lower()
        if "anthropic.claude" in model_lower or "claude" in model_lower:
            body = {
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 4096,
                "messages": [
                    {"role": "user", "content": prompt}
                ]
            }
        elif "amazon.titan" in model_lower or "titan" in model_lower:
            body = {
                "inputText": prompt,
                "textGenerationConfig": {
                    "maxTokenCount": 4096,
                    "temperature": 0.7
                }
            }
        elif "amazon.nova" in model_lower or "nova" in model_lower:
            # Amazon Nova models use messages format
            body = {
                "messages": [
                    {"role": "user", "content": [{"text": prompt}]}
                ],
                "inferenceConfig": {
                    "maxTokens": 4096,
                    "temperature": 0.7
                }
            }
        elif "meta.llama" in model_lower or "llama" in model_lower:
            body = {
                "prompt": prompt,
                "max_gen_len": 2048,
                "temperature": 0.7
            }
        elif "mistral" in model_lower or "mixtral" in model_lower:
            body = {
                "prompt": prompt,
                "max_tokens": 4096,
                "temperature": 0.7
            }
        else:
            # Generic format - try messages format first
            body = {
                "messages": [
                    {"role": "user", "content": prompt}
                ],
                "max_tokens": 4096
            }
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}"
        }
        
        for attempt in range(max_retries):
            try:
                print(f"DEBUG: Bedrock request (attempt {attempt + 1}/{max_retries})")
                print(f"DEBUG: Bedrock endpoint: {endpoint}")
                print(f"DEBUG: Bedrock body keys: {body.keys()}")
                
                async with httpx.AsyncClient(timeout=120.0) as client:
                    response = await client.post(endpoint, json=body, headers=headers)
                    print(f"DEBUG: Bedrock response status: {response.status_code}")
                    
                    # Log error response body for debugging
                    if response.status_code >= 400:
                        try:
                            error_body = response.json()
                            print(f"DEBUG: Bedrock error response: {error_body}")
                        except:
                            print(f"DEBUG: Bedrock error response text: {response.text[:500]}")
                    
                    # Handle throttling
                    if response.status_code == 429:
                        if attempt < max_retries - 1:
                            wait_time = (2 ** attempt) * 2
                            print(f"DEBUG: Bedrock throttled. Waiting {wait_time}s before retry...")
                            await asyncio.sleep(wait_time)
                            continue
                    
                    response.raise_for_status()
                    response_body = response.json()
                    print(f"DEBUG: Bedrock response keys: {response_body.keys()}")
                    
                    # Parse response based on model family
                    if "anthropic.claude" in model_lower or "claude" in model_lower:
                        content = response_body['content'][0]['text']
                    elif "amazon.titan" in model_lower or "titan" in model_lower:
                        content = response_body['results'][0]['outputText']
                    elif "amazon.nova" in model_lower or "nova" in model_lower:
                        # Nova uses output.message.content format
                        content = response_body['output']['message']['content'][0]['text']
                    elif "meta.llama" in model_lower or "llama" in model_lower:
                        content = response_body['generation']
                    elif "mistral" in model_lower or "mixtral" in model_lower:
                        content = response_body['outputs'][0]['text']
                    else:
                        # Try common response formats
                        if 'content' in response_body:
                            content = response_body['content'][0]['text']
                        elif 'output' in response_body:
                            content = response_body['output']['message']['content'][0]['text']
                        else:
                            content = str(response_body)
                    
                    print(f"DEBUG: Bedrock content (first 200 chars): {content[:200]}")
                    return content
                    
            except httpx.HTTPStatusError as e:
                if e.response.status_code == 429 and attempt < max_retries - 1:
                    wait_time = (2 ** attempt) * 2
                    print(f"DEBUG: Bedrock throttled. Waiting {wait_time}s before retry...")
                    await asyncio.sleep(wait_time)
                    continue
                print(f"DEBUG: Bedrock HTTP error: {str(e)}")
                if attempt < max_retries - 1:
                    await asyncio.sleep(2)
                    continue
                raise
            except Exception as e:
                print(f"DEBUG: Bedrock error: {str(e)}")
                if attempt < max_retries - 1:
                    await asyncio.sleep(2)
                    continue
                raise
        
        raise Exception(f"Bedrock failed after {max_retries} attempts")
    
    async def call_llm(self, config: Union[Dict, Any], prompt: str, max_retries: int = 3) -> str:
        """Call an LLM endpoint with the given prompt, with retry logic for rate limits"""
        # Handle both dict and Pydantic model
        if hasattr(config, 'endpoint'):
            endpoint = config.endpoint
            model = config.model
            api_key = getattr(config, 'api_key', None)
            endpoint_type = getattr(config, 'type', 'openai')
        else:
            endpoint = config["endpoint"]
            model = config["model"]
            api_key = config.get("api_key")
            endpoint_type = config.get("type", "openai")
        
        # Check if this is a Bedrock request
        if endpoint_type == "bedrock" or "bedrock" in endpoint.lower():
            # Extract region from endpoint or use default
            region = "us-east-1"
            if "region=" in endpoint:
                region = endpoint.split("region=")[1].split("&")[0]
            
            if not api_key:
                raise Exception("Bedrock API key is required. Get one from AWS Console → Bedrock → API Keys")
            
            return await self.call_bedrock(model, prompt, api_key, region, max_retries)
        
        print(f"DEBUG: Calling LLM - endpoint: {endpoint}, model: {model}")
        
        headers = {"Content-Type": "application/json"}
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"
        
        # Handle different endpoint formats
        if "openrouter.ai" in endpoint:
            payload = {
                "model": model,
                "messages": [{"role": "user", "content": prompt}]
            }
        elif "ollama" in endpoint or "11434" in endpoint:
            payload = {
                "model": model,
                "prompt": prompt,
                "stream": False
            }
            print(f"DEBUG: Ollama payload keys: {payload.keys()}")
            print(f"DEBUG: Ollama prompt length: {len(prompt)} chars")
        else:
            # Generic OpenAI-compatible format
            payload = {
                "model": model,
                "messages": [{"role": "user", "content": prompt}]
            }
        
        for attempt in range(max_retries):
            try:
                async with httpx.AsyncClient(timeout=120.0) as client:
                    print(f"DEBUG: Sending request to {endpoint} (attempt {attempt + 1}/{max_retries})")
                    response = await client.post(endpoint, json=payload, headers=headers)
                    print(f"DEBUG: Response status: {response.status_code}")
                    
                    # Handle rate limiting with exponential backoff
                    if response.status_code == 429:
                        if attempt < max_retries - 1:
                            wait_time = (2 ** attempt) * 2  # 2, 4, 8 seconds
                            print(f"DEBUG: Rate limited (429). Waiting {wait_time}s before retry...")
                            await asyncio.sleep(wait_time)
                            continue
                        else:
                            print(f"DEBUG: Rate limited after {max_retries} attempts. Giving up.")
                    
                    response.raise_for_status()
                    data = response.json()
                    print(f"DEBUG: Response keys: {data.keys()}")
                    
                    # Parse response based on format
                    if "choices" in data:
                        content = data["choices"][0]["message"]["content"]
                        print(f"DEBUG: Extracted content (first 200 chars): {content[:200]}")
                        return content
                    elif "response" in data:
                        content = data["response"]
                        print(f"DEBUG: Ollama raw response type: {type(content)}, length: {len(content)}")
                        print(f"DEBUG: Ollama response (first 500 chars): '{content[:500]}'")
                        if not content or content.strip() == "":
                            print(f"DEBUG: WARNING - Ollama returned empty response!")
                            print(f"DEBUG: Full Ollama response data: {json.dumps(data, indent=2)}")
                        return content
                    else:
                        print(f"DEBUG: Unexpected response format: {data}")
                        return str(data)
                        
            except httpx.HTTPStatusError as e:
                if e.response.status_code == 429 and attempt < max_retries - 1:
                    wait_time = (2 ** attempt) * 2
                    print(f"DEBUG: Rate limited (429). Waiting {wait_time}s before retry...")
                    await asyncio.sleep(wait_time)
                    continue
                print(f"DEBUG: HTTP Error calling LLM: {str(e)}")
                raise
            except Exception as e:
                print(f"DEBUG: Error calling LLM: {str(e)}")
                raise
        
        raise Exception(f"Failed after {max_retries} attempts")
    
    async def call_participant(self, participant_index: int, participant: Union[Dict, Any], prompt: str) -> Dict[str, Any]:
        """Call a single participant and return structured response"""
        try:
            response = await self.call_llm(participant, prompt)
            print(f"DEBUG: Participant {participant_index} response length: {len(response)} chars")
            return {
                "participant": participant_index,
                "response": response,
                "error": None
            }
        except Exception as e:
            print(f"ERROR: Participant {participant_index} failed: {str(e)}")
            return {
                "participant": participant_index,
                "response": f"[Error: {str(e)}]",
                "error": str(e)
            }
    
    async def call_ranking(self, participant_index: int, participant: Union[Dict, Any], prompt: str, responses: List[Dict]) -> Dict[str, Any]:
        """Call a single participant for ranking and return structured response"""
        ranking_prompt = f"""Original prompt: {prompt}

Here are 3 responses from different AI models:

Response A: {responses[0]["response"]}

Response B: {responses[1]["response"]}

Response C: {responses[2]["response"]}

Rank these responses from best to worst (1=best, 3=worst) based on accuracy, helpfulness, and clarity.
Respond ONLY with a JSON object in this exact format:
{{"rankings": {{"A": 1, "B": 2, "C": 3}}, "reasoning": "brief explanation"}}"""
        
        try:
            ranking_response = await self.call_llm(participant, ranking_prompt)
            return {
                "participant": participant_index,
                "ranking": ranking_response,
                "error": None
            }
        except Exception as e:
            print(f"ERROR: Participant {participant_index} ranking failed: {str(e)}")
            return {
                "participant": participant_index,
                "ranking": f"[Error: {str(e)}]",
                "error": str(e)
            }
    
    async def run(self, prompt: str, participants: List[Union[Dict, Any]], chairman: Union[Dict, Any]) -> Dict[str, Any]:
        """Run the consensus process with parallel requests"""
        
        # Step 1: Get initial responses from all participants IN PARALLEL
        print("Step 1: Getting initial responses (parallel)...")
        response_tasks = [
            self.call_participant(i, participant, prompt)
            for i, participant in enumerate(participants)
        ]
        responses = await asyncio.gather(*response_tasks)
        print(f"DEBUG: Total responses collected: {len(responses)}")
        
        # Step 2: Have each participant rank all responses IN PARALLEL
        print("Step 2: Getting rankings (parallel)...")
        ranking_tasks = [
            self.call_ranking(i, participant, prompt, responses)
            for i, participant in enumerate(participants)
        ]
        rankings = await asyncio.gather(*ranking_tasks)
        
        # Step 3: Chairman reviews and creates final output WITH RETRY
        print("Step 3: Chairman creating consensus...")
        chairman_prompt = f"""You are the chairman reviewing a consensus process.

Original prompt: {prompt}

Three AI models provided these responses:
Response A: {responses[0]["response"]}
Response B: {responses[1]["response"]}
Response C: {responses[2]["response"]}

Each model ranked all responses:
Participant 1 rankings: {rankings[0]["ranking"]}
Participant 2 rankings: {rankings[1]["ranking"]}
Participant 3 rankings: {rankings[2]["ranking"]}

Based on the responses and rankings, create a consolidated final answer that represents the best consensus.
Include a brief explanation of how you synthesized the responses."""
        
        # Chairman gets extra retries and longer backoff
        max_chairman_retries = 5
        for attempt in range(max_chairman_retries):
            try:
                final_output = await self.call_llm(chairman, chairman_prompt, max_retries=3)
                break
            except Exception as e:
                if attempt < max_chairman_retries - 1:
                    wait_time = (2 ** attempt) * 3  # 3, 6, 12, 24, 48 seconds
                    print(f"WARNING: Chairman failed (attempt {attempt + 1}/{max_chairman_retries}). Waiting {wait_time}s before retry...")
                    await asyncio.sleep(wait_time)
                else:
                    print(f"ERROR: Chairman failed after {max_chairman_retries} attempts")
                    final_output = f"[Error generating consensus: {str(e)}]"
        
        result = {
            "prompt": prompt,
            "responses": responses,
            "rankings": rankings,
            "final_output": final_output
        }
        
        print(f"DEBUG: Returning result with {len(result['responses'])} responses, {len(result['rankings'])} rankings")
        return result
