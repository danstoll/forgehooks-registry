# FlowForge llm-service - Nintex K2 Integration

## Overview
FlowForge plugin integration for Nintex K2.

## Installation

### 1. Register REST Service Broker

1. Open **K2 Management Console**
2. Navigate to **Integration** > **Service Types**
3. Add new **REST Service Broker**
4. Upload `swagger/llm-service.json`
5. Configure base URL and authentication

### 2. Create Service Instance

1. Go to **Service Instances**
2. Create new instance from the registered service type
3. Configure connection:
   - Base URL: Your FlowForge server URL
   - Authentication: API Key
   - Header: `X-API-Key`

### 3. Generate SmartObjects

1. Navigate to **SmartObjects**
2. Click **Generate SmartObjects** from service instance
3. Select operations to expose
4. Publish SmartObjects

## SmartObject Templates

Pre-configured SmartObject templates are available in the `smartobjects/` folder.
Import these for common operations.

## Available Operations

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

## Using in K2 Forms & Workflows

### In Forms
1. Add SmartObject data source
2. Bind to form controls
3. Execute methods on form events

### In Workflows
1. Add SmartObject event
2. Configure method and parameters
3. Map inputs/outputs

## Support

For issues or questions, visit [FlowForge Support](https://flowforge.io/support)
