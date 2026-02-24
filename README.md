# 🔄 Worker Subscription Converter

[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?logo=javascript&logoColor=black)](https://www.javascript.com/)

A high-quality Cloudflare Workers script that converts various proxy subscription formats (VMess, VLESS, Trojan, Shadowsocks, ShadowsocksR) to Clash or Surge configuration format with automatic IPv6 node detection.

## ✨ Features

- ✅ **Multi-Protocol Support**: VMess, VLESS, Trojan, Shadowsocks, ShadowsocksR
- ✅ **IPv6 Detection**: Automatically identifies and labels IPv6 nodes with `-v6` suffix
- ✅ **Multiple Output Formats**: Clash YAML, Surge configuration, JSON
- ✅ **Subscription Merging**: Combine multiple subscription sources
- ✅ **Base64 Handling**: Supports both standard and URL-safe base64
- ✅ **Error Resilience**: Comprehensive error handling and logging
- ✅ **Fast & Reliable**: Runs on Cloudflare's global edge network
- ✅ **Clean Code**: Well-documented, modern JavaScript with comments

## 📋 Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Supported Formats](#supported-formats)
- [IPv6 Detection](#ipv6-detection)
- [Development](#development)
- [Deployment](#deployment)
- [License](#license)

## 🚀 Installation

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or higher
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
- A Cloudflare account

### Quick Start

1. **Clone the repository:**

```bash
git clone https://github.com/RixGem/worker-subscription-converter.git
cd worker-subscription-converter
```

2. **Install dependencies:**

```bash
npm install
```

3. **Configure Wrangler:**

```bash
wrangler login
```

4. **Deploy to Cloudflare Workers:**

```bash
npm run deploy
```

## 📖 Usage

### Basic Conversion

```bash
https://your-worker.workers.dev/?url=YOUR_SUBSCRIPTION_URL&target=clash
```

### With Multiple Subscriptions

```bash
https://your-worker.workers.dev/?url=SUB1&url=SUB2&target=clash
```

### Different Output Formats

```bash
# Clash format (YAML)
https://your-worker.workers.dev/?url=SUB&target=clash

# Surge format
https://your-worker.workers.dev/?url=SUB&target=surge

# JSON format (debugging)
https://your-worker.workers.dev/?url=SUB&target=json
```

## 🔌 API Reference

### Endpoint

```
GET /?url=<subscription_url>&target=<format>
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | string | Yes | Subscription URL (can be used multiple times) |
| `target` | string | No | Output format: `clash`, `surge`, `json` (default: `clash`) |

### Response Headers

```
Content-Type: application/x-yaml (for Clash)
Content-Type: text/plain (for Surge)
Content-Type: application/json (for JSON)
Cache-Control: public, max-age=3600
Access-Control-Allow-Origin: *
```

### Error Responses

```json
{
  "error": "Error type",
  "message": "Detailed error message"
}
```

HTTP Status Codes:
- `200` - Success
- `400` - Bad Request (invalid parameters)
- `500` - Internal Server Error

## 💡 Examples

### Example 1: Convert Single Subscription to Clash

**Request:**
```bash
curl "https://your-worker.workers.dev/?url=https://example.com/subscription&target=clash"
```

**Response:** Clash YAML configuration with all parsed proxies

### Example 2: Merge Multiple Subscriptions

**Request:**
```bash
curl "https://your-worker.workers.dev/?url=https://provider1.com/sub&url=https://provider2.com/sub&target=clash"
```

**Response:** Combined Clash configuration from both providers

### Example 3: Debug Mode (JSON Output)

**Request:**
```bash
curl "https://your-worker.workers.dev/?url=https://example.com/sub&target=json"
```

**Response:**
```json
[
  {
    "type": "vmess",
    "name": "Hong Kong 01 -v6",
    "server": "2001:db8::1",
    "port": 443,
    "uuid": "...",
    "isIPv6": true
  },
  {
    "type": "trojan",
    "name": "Singapore 01",
    "server": "192.168.1.1",
    "port": 443,
    "isIPv6": false
  }
]
```

### Example 4: Use in Clash

In Clash, set your subscription URL to:
```
https://your-worker.workers.dev/?url=YOUR_ORIGINAL_SUBSCRIPTION&target=clash
```

### Example 5: Use in Surge

In Surge, add the subscription:
```
https://your-worker.workers.dev/?url=YOUR_ORIGINAL_SUBSCRIPTION&target=surge
```

## 📝 Supported Formats

### Input Formats

#### VMess
```
vmess://base64({
  "v": "2",
  "ps": "Node Name",
  "add": "server.com",
  "port": "443",
  "id": "uuid",
  "aid": "0",
  ...
})
```

#### VLESS
```
vless://uuid@server:port?type=ws&security=tls&path=/path#NodeName
```

#### Trojan
```
trojan://password@server:port?sni=server.com#NodeName
```

#### Shadowsocks
```
ss://base64(method:password)@server:port#NodeName
```

#### ShadowsocksR
```
ssr://base64(server:port:protocol:method:obfs:base64(password)/?params)
```

### Output Formats

#### Clash (YAML)
Complete Clash configuration with:
- Proxy list
- Proxy groups (Auto, Proxy)
- Basic rules
- DNS settings

#### Surge
Surge-compatible configuration with:
- Proxy definitions
- Proxy group
- Basic rules

#### JSON
Raw parsed proxy objects for debugging

## 🌐 IPv6 Detection

The converter automatically detects IPv6 addresses using multiple patterns:

1. **Bracketed IPv6**: `[2001:db8::1]`
2. **Pure IPv6**: `2001:db8::1`

When an IPv6 address is detected:
- The `isIPv6` flag is set to `true`
- A `-v6` suffix is added to the node name
- Example: "Hong Kong 01" → "Hong Kong 01 -v6"

**Benefits:**
- Easy identification of IPv6-capable nodes
- Better organization in proxy lists
- Helps avoid IPv6 connectivity issues

## 🛠 Development

### Local Development

Run the worker locally:

```bash
npm run dev
```

Access at: `http://localhost:8787`

### Enable Debug Mode

Edit `worker_to_sub.js` and set:

```javascript
const CONFIG = {
  DEBUG: true,
  // ...
};
```

### Testing

Test with curl:

```bash
# Test basic conversion
curl "http://localhost:8787/?url=https://example.com/sub&target=json"

# Test multiple subscriptions
curl "http://localhost:8787/?url=SUB1&url=SUB2&target=clash"

# Test error handling
curl "http://localhost:8787/"  # Should show usage page
```

### View Logs

Tail live logs:

```bash
npm run tail
```

## 🚢 Deployment

### Deploy to Development

```bash
npm run deploy:dev
```

### Deploy to Production

```bash
npm run deploy:prod
```

### Custom Domain

1. Add your domain in Cloudflare Workers dashboard
2. Update `wrangler.toml`:

```toml
[env.production]
routes = [
  { pattern = "sub.yourdomain.com/*", zone_name = "yourdomain.com" }
]
```

3. Deploy:

```bash
npm run deploy:prod
```

## ⚙️ Configuration

Edit `worker_to_sub.js` to customize:

```javascript
const CONFIG = {
  // Default output format
  DEFAULT_TARGET: 'clash',
  
  // Request timeout (ms)
  FETCH_TIMEOUT: 10000,
  
  // Enable debug logging
  DEBUG: false,
  
  // IPv6 node suffix
  IPV6_SUFFIX: '-v6',
  
  // Clash template settings
  CLASH_TEMPLATE: {
    port: 7890,
    'socks-port': 7891,
    // ...
  }
};
```

## 🔒 Security Considerations

- ✅ No data is stored or logged permanently
- ✅ Runs in Cloudflare's isolated environment
- ✅ HTTPS encryption for all requests
- ✅ CORS enabled for web clients
- ⚠️ Subscription URLs are fetched server-side
- ⚠️ Use only trusted subscription sources

## 📊 Performance

- **Cold Start**: ~50ms
- **Warm Request**: ~10ms
- **Timeout**: 10 seconds per subscription
- **Cache**: 1 hour (HTTP cache)
- **Global**: Served from 300+ Cloudflare locations

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

### Guidelines

1. Follow existing code style
2. Add comments for complex logic
3. Test thoroughly before submitting
4. Update documentation as needed

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 🙏 Acknowledgments

- [Cloudflare Workers](https://workers.cloudflare.com/) for the platform
- [Clash](https://github.com/Dreamacro/clash) for the proxy client
- [Surge](https://nssurge.com/) for the proxy client
- All contributors and users

## 📮 Support

- 🐛 [Report Issues](https://github.com/RixGem/worker-subscription-converter/issues)
- 💬 [Discussions](https://github.com/RixGem/worker-subscription-converter/discussions)
- 📧 Email: [Your Email]

## 🗺️ Roadmap

- [ ] Add more proxy protocols support
- [ ] Implement subscription caching
- [ ] Add custom rule templates
- [ ] Support for encrypted subscriptions
- [ ] Web UI for configuration
- [ ] Proxy health checking
- [ ] Geographic node grouping
- [ ] Advanced filtering options

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/RixGem">RixGem</a>
  <br>
  Powered by <a href="https://workers.cloudflare.com/">Cloudflare Workers</a>
</p>
