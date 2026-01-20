# FlowForge streaming-file-service - Nintex Workflow Cloud Xtension

## Overview
FlowForge plugin Xtension for Nintex Workflow Cloud.

## Installation

1. Go to **Nintex Workflow Cloud** > **Settings** > **Xtensions**
2. Click **Add Xtension**
3. Choose **Add custom connector**
4. Upload `streaming-file-service.swagger.json`
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

## Usage in Workflows

After publishing the Xtension:
1. Open workflow designer
2. Find actions under **FlowForge** category
3. Drag and drop actions into your workflow
4. Configure action parameters

## Support

For issues or questions, visit [FlowForge Support](https://flowforge.io/support)
