# FlowForge Plugin Integration Proposal
## Making Plugins Easy to Use Across Low-Code/No-Code Platforms

This document outlines the strategy and deliverables needed to make FlowForge plugins easily consumable by major workflow automation and low-code platforms.

---

## Executive Summary

Each platform has its own integration mechanism, but they share a common thread: **OpenAPI/Swagger specifications** are the universal language. Our strategy:

1. **Generate platform-optimized OpenAPI specs** from each plugin
2. **Create platform-specific packages** where OpenAPI isn't sufficient
3. **Provide ready-to-import connectors** for each platform

---

## Platform Integration Matrix

| Platform | Integration Type | Primary Format | Auth Support | Effort |
|----------|------------------|----------------|--------------|--------|
| **Nintex Workflow Cloud** | Xtensions | OpenAPI 2.0 (Swagger) | API Key, OAuth2, Basic | Low |
| **Nintex K2** | REST Service Broker + SmartObjects | Swagger 2.0 | API Key, OAuth, Static | Medium |
| **n8n** | Custom Nodes (TypeScript) | npm package | Credentials system | High |
| **Power Automate** | Custom Connectors | OpenAPI 2.0/3.0 | API Key, OAuth2 | Low |
| **OutSystems** | REST Integration + Forge Component | OpenAPI/WSDL | API Key, OAuth2 | Medium |
| **Mendix** | Marketplace Module | REST + Microflow Actions | API Key, OAuth2 | High |

---

## 1. Nintex Workflow Cloud (Xtensions)

### What We Need to Create
**OpenAPI 2.0 Specification files** (one per plugin) with:
- Proper security definitions (API Key in header)
- Well-defined request/response schemas
- Action-oriented operation IDs
- Rich descriptions for UI generation

### Deliverables
```
/integrations/nintex-cloud/
├── llm-service.swagger.json
├── formula-engine.swagger.json
├── streaming-file-service.swagger.json
├── crypto-service.swagger.json
├── icons/
│   ├── llm-service.png (64x64)
│   ├── formula-engine.png
│   └── ...
└── README.md (installation guide)
```

### Implementation
```json
{
  "swagger": "2.0",
  "info": {
    "title": "FlowForge LLM Service",
    "description": "AI-powered text generation, chat, and analysis",
    "version": "2.0.0"
  },
  "host": "{{your-domain}}/api/v1",
  "schemes": ["https"],
  "securityDefinitions": {
    "api_key": {
      "type": "apiKey",
      "in": "header",
      "name": "X-API-Key"
    }
  },
  "paths": {
    "/chat": {
      "post": {
        "operationId": "SendChatMessage",
        "summary": "Send a chat message and get AI response",
        "x-ntx-summary": "Chat with AI",
        // ... full endpoint definition
      }
    }
  }
}
```

### User Experience
1. Admin uploads `.swagger.json` to Nintex Xtensions
2. Configures API key connection
3. Actions appear in workflow designer
4. Drag-and-drop to use

---

## 2. Nintex K2 (SmartObjects + Service Broker)

### What We Need to Create
**Swagger files + SmartObject templates** for K2's REST Service Broker

### Deliverables
```
/integrations/nintex-k2/
├── swagger/
│   ├── llm-service.json
│   ├── formula-engine.json
│   └── ...
├── smartobject-templates/
│   ├── LLM_ChatCompletion.xml
│   ├── LLM_TextGeneration.xml
│   └── ...
└── deployment-guide.md
```

### Implementation Notes
- K2 requires Swagger 2.0 format
- SmartObjects provide the UI abstraction
- Service Broker connects REST to SmartObjects
- Support OAuth and API Key authentication

### Key Features for K2
- **SmartObject Methods**: Create, Read, Execute operations
- **Complex Object Handling**: Serialize/deserialize JSON properly
- **Form Integration**: SmartObjects can bind to K2 Forms

---

## 3. n8n (Custom Nodes)

### What We Need to Create
**TypeScript npm packages** following n8n node structure

### Deliverables
```
/integrations/n8n/
├── n8n-nodes-flowforge/
│   ├── package.json
│   ├── tsconfig.json
│   ├── nodes/
│   │   ├── FlowForgeLLM/
│   │   │   ├── FlowForgeLLM.node.ts
│   │   │   ├── FlowForgeLLM.node.json
│   │   │   └── flowforge-llm.svg
│   │   ├── FlowForgeFormula/
│   │   │   ├── FlowForgeFormula.node.ts
│   │   │   └── ...
│   │   └── FlowForgeFiles/
│   │       └── ...
│   ├── credentials/
│   │   └── FlowForgeApi.credentials.ts
│   └── README.md
└── publish-guide.md
```

### Implementation Example
```typescript
// FlowForgeLLM.node.ts
import {
  INodeType,
  INodeTypeDescription,
  IExecuteFunctions,
  INodeExecutionData,
} from 'n8n-workflow';

export class FlowForgeLLM implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'FlowForge LLM',
    name: 'flowForgeLlm',
    icon: 'file:flowforge-llm.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"]}}',
    description: 'AI text generation, chat, and analysis',
    defaults: {
      name: 'FlowForge LLM',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'flowForgeApi',
        required: true,
      },
    ],
    properties: [
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        options: [
          { name: 'Chat', value: 'chat' },
          { name: 'Generate Text', value: 'generate' },
          { name: 'Summarize', value: 'summarize' },
          { name: 'Classify', value: 'classify' },
          { name: 'Extract Entities', value: 'extract' },
        ],
        default: 'chat',
      },
      // ... more properties per operation
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    // Implementation
  }
}
```

### Distribution
- Publish to npm: `npm publish`
- Users install: `npm install n8n-nodes-flowforge`
- Or submit to n8n Community Nodes

---

## 4. Microsoft Power Automate

### What We Need to Create
**Custom Connector packages** (OpenAPI + icons + apiProperties.json)

### Deliverables
```
/integrations/power-automate/
├── FlowForge-LLM/
│   ├── apiDefinition.swagger.json
│   ├── apiProperties.json
│   ├── icon.png (32x32)
│   └── README.md
├── FlowForge-Formula/
│   └── ...
├── FlowForge-Files/
│   └── ...
└── deployment-guide.md
```

### Implementation
```json
// apiProperties.json
{
  "properties": {
    "connectionParameters": {
      "api_key": {
        "type": "securestring",
        "uiDefinition": {
          "displayName": "API Key",
          "description": "FlowForge API Key",
          "tooltip": "Provide your FlowForge API Key",
          "constraints": {
            "required": "true"
          }
        }
      }
    },
    "iconBrandColor": "#6366f1",
    "capabilities": [],
    "policyTemplateInstances": []
  }
}
```

### Key Features for Power Automate
- **Triggers**: Webhook-based triggers for events
- **Actions**: All plugin operations as actions
- **Dynamic Schema**: Response schemas for downstream use
- **Pagination**: Handle large result sets

### Certification Path
1. Create and test custom connector
2. Submit for Microsoft certification
3. Appear in public connector gallery

---

## 5. OutSystems

### What We Need to Create
**Forge Components** (OutSystems modules) + REST API definitions

### Deliverables
```
/integrations/outsystems/
├── FlowForge_LLM/
│   ├── FlowForge_LLM.oml        # OutSystems Module
│   ├── documentation/
│   │   └── README.md
│   └── resources/
│       └── icon.png
├── FlowForge_Formula/
│   └── ...
├── FlowForge_Files/
│   └── ...
└── REST-API-Specs/
    ├── llm-service.json
    └── ...
```

### Implementation Approach
1. **Create Service Studio Module**
   - Define REST API consumption
   - Create Server Actions wrapping each endpoint
   - Build reusable UI blocks (optional)
   
2. **Expose as Forge Component**
   - Package module with documentation
   - Publish to OutSystems Forge

### Server Action Example
```
// In OutSystems Service Studio
ServerAction: LLM_Chat
  Input: 
    - Message (Text)
    - SystemPrompt (Text, optional)
    - MaxTokens (Integer, default=512)
  Output:
    - Response (Text)
    - Success (Boolean)
    - ErrorMessage (Text)
  
  Logic:
    1. Call REST API (POST /api/v1/chat)
    2. Parse JSON response
    3. Return results
```

---

## 6. Mendix

### What We Need to Create
**Mendix Marketplace Modules** with Java actions and microflow activities

### Deliverables
```
/integrations/mendix/
├── FlowForgeLLM/
│   ├── module/
│   │   ├── FlowForgeLLM.mpk
│   │   ├── javasource/
│   │   │   └── flowforge/
│   │   │       └── actions/
│   │   ├── microflows/
│   │   └── pages/ (optional demo pages)
│   ├── documentation/
│   │   └── README.md
│   └── test-app/
├── FlowForgeFormula/
│   └── ...
└── FlowForgeFiles/
    └── ...
```

### Implementation Approach
1. **REST API Integration**
   - Use Mendix's Consume REST Service feature
   - Map endpoints to domain model
   
2. **Java Actions** (for complex operations)
   ```java
   // Chat.java
   public class Chat extends CustomJavaAction<String> {
       private String message;
       private String systemPrompt;
       
       @Override
       public String executeAction() throws Exception {
           // Call FlowForge API
           return response;
       }
   }
   ```

3. **Microflow Activities**
   - Expose Java actions as toolbox items
   - Create helper microflows for common patterns

### Distribution
- Export as .mpk module
- Publish to Mendix Marketplace
- Users import directly into Studio Pro

---

## Shared Components

### OpenAPI Generator Script
Create a script to generate platform-specific OpenAPI files from our base specs:

```python
# scripts/generate-openapi.py
"""
Generate platform-optimized OpenAPI specifications from forgehook.json
"""

def generate_nintex_swagger(plugin_path, output_path):
    """Generate Nintex-compatible Swagger 2.0"""
    pass

def generate_power_automate_connector(plugin_path, output_path):
    """Generate Power Automate connector package"""
    pass

def generate_n8n_node_skeleton(plugin_path, output_path):
    """Generate n8n node TypeScript skeleton"""
    pass
```

### Common Features to Expose

For each plugin, expose these as actions/operations:

#### LLM Service
| Action | Description |
|--------|-------------|
| Chat | Send message, get AI response |
| Generate Text | Complete/generate text |
| Summarize | Summarize documents |
| Classify | Categorize text |
| Extract Entities | Extract structured data |
| Generate Embeddings | Create vector embeddings |

#### Formula Engine
| Action | Description |
|--------|-------------|
| Evaluate Formula | Calculate Excel formula |
| Batch Calculate | Process multiple formulas |
| Validate Formula | Check formula syntax |
| List Functions | Get available functions |

#### Streaming File Service
| Action | Description |
|--------|-------------|
| Upload File | Upload large files |
| Download File | Stream download |
| Process CSV | Parse/transform CSV |
| Process Excel | Read/write Excel |
| Convert Format | Convert between formats |

#### Crypto Service
| Action | Description |
|--------|-------------|
| Encrypt Data | Encrypt with AES/RSA |
| Decrypt Data | Decrypt data |
| Hash Data | Generate hash (SHA256, etc.) |
| Sign Data | Create digital signature |
| Verify Signature | Verify digital signature |
| Generate Keys | Create key pairs |

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Create OpenAPI 2.0 specs for all plugins
- [ ] Create OpenAPI 3.0 specs for all plugins
- [ ] Build OpenAPI generator script
- [ ] Create icons/branding for each plugin

### Phase 2: Microsoft & Nintex (Week 3-4)
- [ ] Power Automate custom connectors (4 plugins)
- [ ] Nintex Workflow Cloud Xtensions (4 plugins)
- [ ] Nintex K2 Swagger + SmartObject templates
- [ ] Testing and documentation

### Phase 3: n8n (Week 5-6)
- [ ] n8n node package structure
- [ ] Implement all nodes with credentials
- [ ] Test with n8n self-hosted
- [ ] Publish to npm
- [ ] Submit to n8n Community Nodes

### Phase 4: Low-Code Platforms (Week 7-8)
- [ ] OutSystems Forge components
- [ ] Mendix Marketplace modules
- [ ] Integration testing
- [ ] Documentation and examples

### Phase 5: Certification & Publishing (Week 9-10)
- [ ] Power Automate connector certification
- [ ] OutSystems Forge publishing
- [ ] Mendix Marketplace publishing
- [ ] Marketing materials

---

## Recommended Priority

Based on market reach and implementation effort:

1. **Power Automate** - Largest user base, easy OpenAPI import
2. **Nintex Workflow Cloud** - Direct competitor, OpenAPI-based
3. **n8n** - Growing open-source community, good visibility
4. **OutSystems** - Enterprise low-code, REST-friendly
5. **Nintex K2** - Legacy but still used, more complex
6. **Mendix** - Requires most custom work

---

## Next Steps

1. **Approve this proposal** and prioritize platforms
2. **Set up integration folder structure** in repository
3. **Begin with OpenAPI generation** (foundation for most platforms)
4. **Create first Power Automate connector** as proof of concept
5. **Iterate based on feedback**

---

## Questions to Resolve

1. Will plugins be self-hosted or SaaS? (Affects connector URLs)
2. What authentication method is preferred? (API Key recommended)
3. Do we want certified/published connectors or private only?
4. What's the branding/naming convention? (FlowForge vs custom?)
