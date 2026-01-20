# FlowForge streaming-file-service - Nintex K2 Integration

## Overview
FlowForge plugin integration for Nintex K2.

## Installation

### 1. Register REST Service Broker

1. Open **K2 Management Console**
2. Navigate to **Integration** > **Service Types**
3. Add new **REST Service Broker**
4. Upload `swagger/streaming-file-service.json`
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

| Unknown | Initialize a chunked upload session. Returns uploadId for su... |
| Unknown | Upload a single chunk. Supports resume - re-upload failed ch... |
| Unknown | Complete chunked upload - assembles chunks and verifies inte... |
| Unknown | Get upload progress - which chunks received, resume point. |
| Unknown | Cancel and cleanup an incomplete upload. |
| Unknown | Stream download with Range header support for resume. |
| Unknown | Initialize chunked download - get download manifest. |
| Unknown | Stream upload directly to cloud storage (S3/Azure/GCS) witho... |
| Unknown | Stream download from cloud storage to local or another desti... |
| Unknown | Copy files between cloud providers (S3 to Azure, GCS to S3, ... |
| Unknown | Generate presigned URLs for direct browser uploads/downloads... |
| Unknown | Split large PDF into smaller files by page ranges. |
| Unknown | Merge multiple PDFs into one. |
| Unknown | Compress files (zip, gzip, tar.gz) with streaming. |
| Unknown | Extract compressed archives with streaming. |
| Unknown | Transcode video/audio files. Runs asynchronously for large f... |
| Unknown | Extract audio track from video file. |
| Unknown | Generate thumbnails from video at specified timestamps. |
| Unknown | Check status of async transformation job. |
| Unknown | Calculate checksum of file without loading into memory. |

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
