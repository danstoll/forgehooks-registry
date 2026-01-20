# FlowForge formula-engine - Nintex Workflow Cloud Xtension

## Overview
FlowForge plugin Xtension for Nintex Workflow Cloud.

## Installation

1. Go to **Nintex Workflow Cloud** > **Settings** > **Xtensions**
2. Click **Add Xtension**
3. Choose **Add custom connector**
4. Upload `formula-engine.swagger.json`
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

| No actions defined | |

## Usage in Workflows

After publishing the Xtension:
1. Open workflow designer
2. Find actions under **FlowForge** category
3. Drag and drop actions into your workflow
4. Configure action parameters

## Support

For issues or questions, visit [FlowForge Support](https://flowforge.io/support)
