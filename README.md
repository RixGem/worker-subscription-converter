# 🚀 Cloudflare Worker - Optimized IP Subscription Converter

High-performance Cloudflare Workers script that fetches optimized Cloudflare IPs and generates proxy subscriptions with intelligent regional prioritization and performance-based sorting.

[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange?logo=cloudflare)](https://workers.cloudflare.com/)
[![IPv6 Support](https://img.shields.io/badge/IPv6-Supported-blue)](https://www.cloudflare.com/ipv6/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

## ✨ Features

### 🎯 Smart IP Selection
- **Regional Prioritization**: Hong Kong (HKG) and Singapore (SIN) regions get top priority
- **Operator-Based Sorting**: Prioritizes China Mobile (CM), China Unicom (CU), and China Telecom (CT) IPs
- **Performance Metrics**: Sorts by latency (lower better) and speed (higher better)
- **Dual Stack Support**: Full IPv4 and IPv6 support with automatic detection

### 📊 Intelligent Sorting Algorithm
```
Priority Level 1: HKG/SIN Optimized IPs (sorted by performance)
    ↓
Priority Level 2: CM/CU/CT Operator IPs (sorted by performance)
    ↓
Priority Level 3: Backup IPs from other regions (sorted by performance)
```

### 🔄 Multiple Output Formats
- **V2Ray/VMess**: Base64 encoded subscription links
- **Clash**: YAML configuration with auto proxy groups
- **Surge**: Full Surge configuration format

### 🛡️ Robust Error Handling
- Gracefully handles missing latency/speed data
- Fallback mechanisms for incomplete API responses
- Comprehensive error logging and reporting

---

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Deployment Guide](#-deployment-guide)
- [Configuration](#-configuration)
- [Usage Examples](#-usage-examples)
- [API Reference](#-api-reference)
- [How It Works](#-how-it-works)
- [Troubleshooting](#-troubleshooting)
- [Advanced Usage](#-advanced-usage)
- [Contributing](#-contributing)

---

## 🚀 Quick Start

### Prerequisites
- A Cloudflare account (free tier works!)
- A V2Ray/VMess UUID (generate one [here](https://www.uuidgenerator.net/))
- Basic understanding of proxy configurations

### 5-Minute Setup

1. **Clone this repository**
```bash
git clone https://github.com/RixGem/worker-subscription-converter.git
cd worker-subscription-converter
```

2. **Configure your settings**
   - Edit `worker_to_sub.js`
   - Replace `YOUR-UUID-HERE` with your actual UUID
   - Replace `your-domain.com` with your domain

3. **Deploy to Cloudflare Workers**
   - Copy the script content
   - Paste into Cloudflare Workers dashboard
   - Click "Save and Deploy"

4. **Test your subscription**
```bash
curl https://your-worker.workers.dev/
```

---

## 📦 Deployment Guide

### Method 1: Cloudflare Dashboard (Recommended for Beginners)

#### Step 1: Create a Worker
1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages** in the left sidebar
3. Click **Create Application** → **Create Worker**
4. Give your worker a name (e.g., `ip-subscription-generator`)
5. Click **Deploy**

#### Step 2: Upload Script
1. Click **Edit Code** on your newly created worker
2. Delete the default code
3. Copy the entire content of `worker_to_sub.js`
4. Paste it into the editor
5. Click **Save and Deploy**

#### Step 3: Configure Custom Domain (Optional)
1. Go to **Workers & Pages** → Your Worker
2. Click **Triggers** tab
3. Click **Add Custom Domain**
4. Enter your subdomain (e.g., `sub.yourdomain.com`)
5. Click **Add Custom Domain**

### Method 2: Wrangler CLI (Advanced Users)

#### Step 1: Install Wrangler
```bash
npm install -g wrangler
```

#### Step 2: Authenticate
```bash
wrangler login
```

#### Step 3: Create wrangler.toml
```toml
name = "ip-subscription-generator"
main = "worker_to_sub.js"
compatibility_date = "2024-01-01"

[env.production]
workers_dev = true
```

#### Step 4: Deploy
```bash
wrangler deploy
```

---

## ⚙️ Configuration

### Essential Configuration

Open `worker_to_sub.js` and modify these critical values:

#### 1. UUID Configuration
Replace the placeholder UUID with your own:

```javascript
// Around line 165
id: 'YOUR-UUID-HERE'  // Replace with: a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

**Generate a UUID:**
- Online: https://www.uuidgenerator.net/
- Command line: `uuidgen` (Linux/Mac) or `[guid]::NewGuid()` (PowerShell)

#### 2. Domain Configuration
Replace all instances of `your-domain.com` with your actual domain:

```javascript
// Multiple locations in the file
host: 'your-domain.com'        // Replace with: proxy.example.com
sni: 'your-domain.com'         // Replace with: proxy.example.com
servername: 'your-domain.com'  // Replace with: proxy.example.com
```

#### 3. Custom WebSocket Path (Optional)
```javascript
// Around line 168
path: '/ws'  // Change to: /your-custom-path
```

### Advanced Configuration

#### Modify Priority Regions
```javascript
// Line 7
const PRIORITY_REGIONS = ['HKG', 'SIN']; 
// Add more: ['HKG', 'SIN', 'TPE', 'NRT']
```

#### Adjust Result Limits
```javascript
// In subscription generation functions
.slice(0, 50)  // Change to: .slice(0, 100) for more nodes
```

#### Customize Operator Mapping
```javascript
// Line 8-12
const OPERATOR_MAP = {
  '移动': 'CM',
  '联通': 'CU',
  '电信': 'CT',
  '其他': 'OTHER'  // Add custom mappings
};
```

---

## 📖 Usage Examples

### Basic Usage

#### V2Ray/VMess Format (Default)
```bash
https://your-worker.workers.dev/
```

**Response:** Base64 encoded subscription link
```
dmVzc3M6Ly9leUoySWpvaU1pSXNJbkJ6SWpvaVJXUm5aWE5yZVMxWFV5...
```

#### Clash Format
```bash
https://your-worker.workers.dev/?format=clash
```

**Response:** YAML configuration
```yaml
proxies:
  - name: "Edgesky-WS-HKG-Optimized"
    type: vmess
    server: 104.16.132.229
    port: 443
    ...
```

#### Surge Format
```bash
https://your-worker.workers.dev/?format=surge
```

**Response:** Surge configuration
```ini
[Proxy]
Edgesky-WS-HKG-Optimized = vmess, 104.16.132.229, 443, ...
```

### Client Configuration

#### Clash
1. Open Clash
2. Go to **Profiles**
3. Click **Add** → **URL**
4. Paste: `https://your-worker.workers.dev/?format=clash`
5. Click **Download**

#### V2RayN (Windows)
1. Open V2RayN
2. Click **Subscription** → **Subscription Settings**
3. Click **Add**
4. Paste your worker URL
5. Click **Update Subscription**

#### Quantumult X (iOS)
1. Open Quantumult X
2. Go to **Settings** → **Subscription**
3. Tap **+** icon
4. Paste: `https://your-worker.workers.dev/`
5. Tap **OK**

#### Surge (iOS/macOS)
1. Open Surge
2. Go to **Profiles**
3. Tap **Download Profile from URL**
4. Paste: `https://your-worker.workers.dev/?format=surge`
5. Tap **OK**

---

## 🔌 API Reference

### Data Source: api.4ce.cn/api/bestCFIP

This worker fetches optimized Cloudflare IPs from the 4ce.cn API.

#### API Endpoint
```
GET https://api.4ce.cn/api/bestCFIP
```

#### Response Format

**Complete Entry (IPv4):**
```json
{
  "name": "移动",
  "ip": "162.159.36.128",
  "colo": "SIN",
  "latency": 70,
  "speed": 250,
  "uptime": "2026-02-23 22:45:06"
}
```

**Partial Entry (IPv6 without latency):**
```json
{
  "name": "电信",
  "ip": "2803:f800:52::326e:a561",
  "colo": "SIN",
  "speed": 647,
  "uptime": "2026-02-25 00:00:00"
}
```

#### Field Descriptions

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `name` | string | ISP/Operator name in Chinese | "移动", "联通", "电信" |
| `ip` | string | IPv4 or IPv6 address | "104.16.132.229" |
| `colo` | string | Cloudflare data center code | "HKG", "SIN", "LAX" |
| `latency` | number\|null | Round-trip time in ms (may be null for IPv6) | 70 |
| `speed` | number | Download speed in Mbps | 250 |
| `uptime` | string | Last update timestamp | "2026-02-23 22:45:06" |

#### Operator Mapping

| Chinese Name | Code | Full Name |
|-------------|------|-----------|
| 移动 | CM | China Mobile |
| 联通 | CU | China Unicom |
| 电信 | CT | China Telecom |

---

## 🧠 How It Works

### Regional Optimization Strategy

#### Why HKG/SIN Priority?

1. **Geographic Proximity**: Closest data centers to Asia-Pacific users
2. **Lower Latency**: Typically 20-80ms for regional users
3. **High Bandwidth**: Major Cloudflare hubs with excellent connectivity
4. **Network Quality**: Premium peering arrangements

#### Priority System Explained

```javascript
// Priority Level 1: HKG/SIN Optimized
[
  { ip: "104.16.132.229", colo: "HKG", latency: 35, speed: 300 },
  { ip: "172.64.147.89", colo: "SIN", latency: 42, speed: 280 }
]

// Priority Level 2: Operator IPs (CM/CU/CT)
[
  { ip: "162.159.36.128", name: "移动", latency: 65, speed: 250 },
  { ip: "104.21.48.217", name: "电信", latency: 58, speed: 270 }
]

// Priority Level 3: Backup IPs
[
  { ip: "172.67.194.142", colo: "LAX", latency: 120, speed: 200 }
]
```

### Performance Sorting Logic

#### Sorting Algorithm

```javascript
function comparePerformance(a, b) {
  // Step 1: Compare by latency (if both have it)
  if (a.latency !== null && b.latency !== null) {
    if (a.latency !== b.latency) {
      return a.latency - b.latency;  // Lower latency wins
    }
    return b.speed - a.speed;  // Higher speed wins if latency equal
  }
  
  // Step 2: Prefer entries with latency data
  if (a.latency !== null) return -1;
  if (b.latency !== null) return 1;
  
  // Step 3: Compare by speed only (for IPv6 without latency)
  return b.speed - a.speed;
}
```

#### Example Sorting Scenario

**Input:**
```javascript
[
  { ip: "IP1", latency: 50, speed: 200 },
  { ip: "IP2", latency: 45, speed: 180 },  // ← Winner (lowest latency)
  { ip: "IP3", latency: null, speed: 300 },
  { ip: "IP4", latency: 45, speed: 250 }   // ← 2nd (same latency, higher speed)
]
```

**Output:**
```javascript
[
  { ip: "IP2", latency: 45, speed: 180 },   // Rank 1
  { ip: "IP4", latency: 45, speed: 250 },   // Rank 2
  { ip: "IP1", latency: 50, speed: 200 },   // Rank 3
  { ip: "IP3", latency: null, speed: 300 }  // Rank 4
]
```

### Node Naming Convention

```javascript
generateNodeName(ip, protocol)
```

**Examples:**
- `Edgesky-WS-HKG-Optimized` - Priority region, IPv4
- `Edgesky-gRPC-SIN-Optimized` - Priority region, IPv4, gRPC
- `Edgesky-WS-SIN-v6` - Priority region, IPv6
- `Edgesky-WS-LAX-v4` - Non-priority region, IPv4
- `Edgesky-WS-NRT-v6` - Non-priority region, IPv6

---

## 🐛 Troubleshooting

### Common Issues

#### 1. "Error: API returned status 500"

**Cause:** API endpoint is down or unreachable

**Solutions:**
- Check if https://api.4ce.cn/api/bestCFIP is accessible
- Wait a few minutes and try again
- Check Cloudflare Workers logs for details

```bash
# Test API directly
curl https://api.4ce.cn/api/bestCFIP
```

#### 2. "Invalid UUID format" in Client

**Cause:** UUID not properly configured

**Solutions:**
- Verify UUID format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- Generate new UUID: https://www.uuidgenerator.net/
- Check all instances in code are replaced

```javascript
// Correct format
id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'

// Wrong format
id: 'YOUR-UUID-HERE'  // ❌ Not replaced
id: 'a1b2c3d4e5f67890'  // ❌ Missing dashes
```

#### 3. Subscription Not Updating

**Cause:** Client caching old subscription

**Solutions:**
- Force refresh in your client app
- Clear subscription cache
- Add version parameter: `?format=clash&v=2`

#### 4. No Nodes Appearing

**Cause:** Domain not configured correctly

**Solutions:**
- Verify domain in all locations
- Check DNS resolution: `nslookup your-domain.com`
- Ensure domain matches your Cloudflare setup

```bash
# Test DNS
nslookg proxy.example.com

# Should return Cloudflare IP
```

#### 5. IPv6 Nodes Not Working

**Cause:** ISP doesn't support IPv6

**Solutions:**
- Disable IPv6 nodes in client
- Check IPv6 connectivity: `ping6 google.com`
- Use IPv4-only filtering

```bash
# Test IPv6 connectivity
curl -6 https://ipv6.google.com
```

### Debug Mode

Add debug parameter to see raw API data:

```javascript
// Add to handleRequest function
if (url.searchParams.get('debug') === 'true') {
  const ips = await getPreferredIps();
  return new Response(JSON.stringify(ips, null, 2), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

**Usage:**
```bash
curl https://your-worker.workers.dev/?debug=true
```

### Performance Optimization

#### Reduce Response Time

```javascript
// Limit results
.slice(0, 20)  // Instead of 50

// Add caching
'Cache-Control': 'public, max-age=600'  // 10 minutes
```

#### Monitor Worker Performance

1. Go to Cloudflare Dashboard
2. Navigate to **Workers & Pages**
3. Click your worker
4. View **Metrics** tab

**Key Metrics:**
- Requests per second
- Duration (p50, p99)
- Error rate

---

## 🔧 Advanced Usage

### Custom Filtering

Add custom filters to prioritize specific criteria:

```javascript
// Filter by minimum speed
function filterBySpeed(ips, minSpeed) {
  return ips.filter(ip => ip.speed >= minSpeed);
}

// Filter by maximum latency
function filterByLatency(ips, maxLatency) {
  return ips.filter(ip => ip.latency === null || ip.latency <= maxLatency);
}

// Usage in getPreferredIps
const filtered = filterBySpeed(processed, 100);
```

### Multi-Region Support

Add support for multiple priority regions:

```javascript
const REGION_PRIORITIES = {
  tier1: ['HKG', 'SIN'],
  tier2: ['TPE', 'NRT', 'ICN'],
  tier3: ['LAX', 'SJC', 'SEA']
};

function categorizeIPsByTier(ips) {
  // Implementation here
}
```

### Custom Protocol Support

Add gRPC protocol support:

```javascript
function generateNodeName(ip, protocol = 'WS') {
  // Support WS, gRPC, TCP
  const protocols = {
    'WS': 'WS',
    'GRPC': 'gRPC',
    'TCP': 'TCP'
  };
  
  const protocolName = protocols[protocol.toUpperCase()] || 'WS';
  // ... rest of implementation
}
```

### Webhook Notifications

Get notified when new IPs are available:

```javascript
async function notifyWebhook(ips) {
  const webhookUrl = 'https://your-webhook-url.com';
  
  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      count: ips.length,
      topIP: ips[0],
      timestamp: new Date().toISOString()
    })
  });
}
```

---

## 📊 Performance Benchmarks

### Typical Response Times

| Scenario | Response Time | Notes |
|----------|--------------|-------|
| First request (cold start) | 200-500ms | Worker initialization |
| Cached request | 50-150ms | With CDN caching |
| API fetch | 100-300ms | 4ce.cn API latency |
| Subscription generation | 10-50ms | Processing time |

### Optimization Tips

1. **Enable Caching**: Use `Cache-Control` headers
2. **Reduce Node Count**: Limit to 20-30 nodes for faster processing
3. **Use Custom Domain**: Better DNS resolution and caching
4. **Monitor API Health**: Set up uptime monitoring for API endpoint

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

### Reporting Issues

1. Check existing issues first
2. Provide detailed description
3. Include error messages and logs
4. Share your configuration (remove sensitive data)

### Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Setup

```bash
# Clone repo
git clone https://github.com/RixGem/worker-subscription-converter.git

# Install dependencies (if any)
npm install

# Run tests
npm test

# Deploy to test environment
wrangler deploy --env staging
```

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [4ce.cn](https://4ce.cn) - For providing the optimized IP API
- [Cloudflare Workers](https://workers.cloudflare.com/) - Serverless platform
- [V2Ray Project](https://www.v2ray.com/) - Proxy protocol
- Community contributors and testers

---

## 📬 Contact & Support

- **Issues**: [GitHub Issues](https://github.com/RixGem/worker-subscription-converter/issues)
- **Discussions**: [GitHub Discussions](https://github.com/RixGem/worker-subscription-converter/discussions)

---

## 🔄 Changelog

### Version 1.0.0 (2026-02-25)
- ✨ Initial release
- 🎯 HKG/SIN regional prioritization
- 📊 Performance-based sorting
- 🌐 IPv4/IPv6 dual stack support
- 📦 Multiple format support (V2Ray, Clash, Surge)
- 🛡️ Robust error handling

---

<div align="center">

**[⬆ Back to Top](#-cloudflare-worker---optimized-ip-subscription-converter)**

Made with ❤️ by [RixGem](https://github.com/RixGem)

</div>
