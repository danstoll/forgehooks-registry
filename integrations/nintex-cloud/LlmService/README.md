# FlowForge llm-service - Nintex Workflow Cloud Xtension

## Overview
FlowForge plugin Xtension for Nintex Workflow Cloud.

## Installation

1. Go to **Nintex Workflow Cloud** > **Settings** > **Xtensions**
2. Click **Add Xtension**
3. Choose **Add custom connector**
4. Upload `llm-service.swagger.json`
5. Configure authentication (API Key)
6. Click **Publish**

## Configuration

### API Key Setup
1. In the Xtension settings, select **API Key** authentication
2. Set header name: `X-API-Key`
3. Enter your FlowForge API key

### Base URL
Update the host in the Swagger file to your FlowForge instance URL.

## Available Actions

| Unknown | List available LLM providers |
| Unknown | Configure a provider with API credentials |
| Unknown | List available models for a provider |
| Unknown | Check provider health status |
| Unknown | Chat with a specific provider |
| Unknown | Generate embeddings with a specific provider |
| Unknown | Universal chat endpoint with provider selection |
| Unknown | Chat completion (vLLM/default provider) |
| Unknown | Simple chat with just a message |
| Unknown | Text generation/completion |
| Unknown | Generate text embeddings |
| Unknown | Classify text into categories |
| Unknown | Extract named entities from text |
| Unknown | Summarize text content |
| Unknown | Vision-based OCR from images |
| Unknown | Describe image content |
| Unknown | Extract structured data from images |
| Unknown | Transform data using natural language |
| Unknown | Transform data to match a target schema |
| Unknown | Convert between data formats |

## Usage in Workflows

After publishing the Xtension:
1. Open workflow designer
2. Find actions under **FlowForge** category
3. Drag and drop actions into your workflow
4. Configure action parameters

## Support

For issues or questions, visit [FlowForge Support](https://flowforge.io/support)
