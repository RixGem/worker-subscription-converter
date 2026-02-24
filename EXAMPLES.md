# 📚 Usage Examples

Comprehensive examples for using the Worker Subscription Converter.

## Table of Contents

- [Basic Usage](#basic-usage)
- [Advanced Usage](#advanced-usage)
- [Client Configuration](#client-configuration)
- [Troubleshooting](#troubleshooting)

## Basic Usage

### 1. Simple Conversion to Clash

**Scenario:** Convert a single subscription to Clash format

```bash
curl "https://your-worker.workers.dev/?url=https://provider.com/subscription&target=clash"
```

**Result:** Returns Clash YAML configuration ready to use

---

### 2. Convert to Surge

**Scenario:** Get Surge-compatible configuration

```bash
curl "https://your-worker.workers.dev/?url=https://provider.com/subscription&target=surge"
```

**Result:** Returns Surge configuration file

---

### 3. Debug Mode (JSON)

**Scenario:** See raw parsed proxy data for debugging

```bash
curl "https://your-worker.workers.dev/?url=https://provider.com/subscription&target=json"
```

**Result:** Returns JSON array of parsed proxies with all fields

---

## Advanced Usage

### 4. Merge Multiple Subscriptions

**Scenario:** Combine proxies from multiple providers

```bash
curl "https://your-worker.workers.dev/\
  ?url=https://provider1.com/sub\
  &url=https://provider2.com/sub\
  &url=https://provider3.com/sub\
  &target=clash"
```

**Benefits:**
- One unified subscription for all your providers
- Automatic deduplication (if enabled)
- Single update point

---

### 5. URL Encoding for Complex URLs

**Scenario:** Your subscription URL has special characters

```bash
# Original URL with special chars
SUB_URL="https://example.com/sub?token=abc123&user=test"

# URL encode it
ENCODED=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$SUB_URL'))")

# Use encoded URL
curl "https://your-worker.workers.dev/?url=$ENCODED&target=clash"
```

---

### 6. Download Configuration File

**Scenario:** Save the configuration to a file

```bash
# Download Clash config
curl -o clash-config.yaml "https://your-worker.workers.dev/?url=SUB&target=clash"

# Download Surge config
curl -o surge-config.conf "https://your-worker.workers.dev/?url=SUB&target=surge"
```

---

### 7. Filter IPv6 Nodes (Using jq)

**Scenario:** Extract only IPv6 nodes

```bash
curl "https://your-worker.workers.dev/?url=SUB&target=json" | \
  jq '[.[] | select(.isIPv6 == true)]'
```

**Result:** JSON array containing only IPv6 nodes

---

### 8. Count Proxies by Type

**Scenario:** Analyze subscription contents

```bash
curl -s "https://your-worker.workers.dev/?url=SUB&target=json" | \
  jq 'group_by(.type) | map({type: .[0].type, count: length})'
```

**Output:**
```json
[
  {"type": "vmess", "count": 45},
  {"type": "trojan", "count": 23},
  {"type": "ss", "count": 12}
]
```

---

## Client Configuration

### Clash Configuration

#### Option 1: Direct Subscription

In Clash, add subscription URL:

```yaml
# In Clash config or GUI
subscription-url: https://your-worker.workers.dev/?url=YOUR_SUB&target=clash
```

#### Option 2: Download and Import

```bash
# Download config
curl -o config.yaml "https://your-worker.workers.dev/?url=YOUR_SUB&target=clash"

# Copy to Clash config directory
# Windows: %USERPROFILE%/.config/clash/
# macOS: ~/.config/clash/
# Linux: ~/.config/clash/
cp config.yaml ~/.config/clash/config.yaml

# Restart Clash
```

---

### Surge Configuration

#### Import Subscription

1. Open Surge
2. Go to "Profiles" tab
3. Click "+" to add new profile
4. Select "Download Profile from URL"
5. Enter:
   ```
   https://your-worker.workers.dev/?url=YOUR_SUB&target=surge
   ```
6. Click "Download"

#### Command Line

```bash
# Download Surge config
curl -o surge.conf "https://your-worker.workers.dev/?url=YOUR_SUB&target=surge"

# Copy to Surge config directory
# macOS: ~/Library/Application Support/Surge/
# iOS: Use Surge app to import
```

---

### Automated Updates

#### Using cron (Linux/macOS)

```bash
# Add to crontab (crontab -e)
# Update Clash config every 6 hours
0 */6 * * * curl -o ~/.config/clash/config.yaml "https://your-worker.workers.dev/?url=YOUR_SUB&target=clash" && pkill -HUP clash
```

#### Using Task Scheduler (Windows)

1. Create `update-clash.bat`:
```batch
@echo off
curl -o "%USERPROFILE%\.config\clash\config.yaml" "https://your-worker.workers.dev/?url=YOUR_SUB&target=clash"
taskkill /F /IM clash.exe
start "" "C:\Program Files\Clash\clash.exe"
```

2. Schedule in Task Scheduler to run every 6 hours

---

## Troubleshooting

### Issue 1: Empty Response

**Problem:** Worker returns empty or error response

**Solution:**

```bash
# Check if subscription URL is accessible
curl -I "YOUR_SUBSCRIPTION_URL"

# Test with JSON output for detailed error info
curl "https://your-worker.workers.dev/?url=YOUR_SUB&target=json"

# Check worker logs
wrangler tail
```

---

### Issue 2: No IPv6 Nodes Detected

**Problem:** IPv6 nodes not being labeled with `-v6`

**Debug:**

```bash
# Get raw JSON output
curl "https://your-worker.workers.dev/?url=YOUR_SUB&target=json" > proxies.json

# Check isIPv6 flag
cat proxies.json | jq '.[] | select(.isIPv6 == true)'

# Check server addresses
cat proxies.json | jq '.[].server'
```

---

### Issue 3: Slow Response

**Problem:** Conversion takes too long

**Solutions:**

1. **Check subscription size:**
```bash
curl -s "YOUR_SUB" | wc -l
# If > 1000 lines, consider splitting
```

2. **Use multiple workers:**
```bash
# Split large subscription into parts
SUB1="https://provider.com/sub?region=asia"
SUB2="https://provider.com/sub?region=europe"
```

3. **Enable caching:**
   - Results are cached for 1 hour by default
   - Second request will be instant

---

### Issue 4: Invalid Base64

**Problem:** "Invalid base64 string" error

**Debug:**

```bash
# Fetch subscription content
curl "YOUR_SUB" > sub.txt

# Check if it's base64
head -n 5 sub.txt

# Try to decode manually
base64 -d sub.txt

# If it works, the issue might be URL-safe vs standard base64
```

---

### Issue 5: Proxy Not Working

**Problem:** Converted proxies don't work in client

**Checklist:**

1. **Verify proxy in JSON format:**
```bash
curl "https://your-worker.workers.dev/?url=YOUR_SUB&target=json" | jq '.[0]'
```

2. **Check required fields:**
   - VMess: uuid, server, port
   - Trojan: password, server, port
   - SS: cipher, password, server, port

3. **Test original subscription:**
```bash
# Import original subscription directly to client
# If it doesn't work, issue is with original subscription
```

4. **Check network connectivity:**
```bash
# Test if you can reach the proxy server
ping proxy-server.com
telnet proxy-server.com 443
```

---

## Integration Examples

### Python Script

```python
import requests
import json

def get_proxies(subscription_url):
    """Fetch and parse proxies from subscription"""
    converter_url = f"https://your-worker.workers.dev/?url={subscription_url}&target=json"
    
    response = requests.get(converter_url)
    response.raise_for_status()
    
    proxies = response.json()
    return proxies

# Usage
proxies = get_proxies("https://provider.com/sub")
print(f"Found {len(proxies)} proxies")

# Filter IPv6 nodes
ipv6_proxies = [p for p in proxies if p.get('isIPv6')]
print(f"IPv6 nodes: {len(ipv6_proxies)}")
```

---

### Node.js Script

```javascript
const axios = require('axios');

async function getProxies(subscriptionUrl) {
  const converterUrl = `https://your-worker.workers.dev/?url=${encodeURIComponent(subscriptionUrl)}&target=json`;
  
  const response = await axios.get(converterUrl);
  return response.data;
}

// Usage
(async () => {
  const proxies = await getProxies('https://provider.com/sub');
  console.log(`Found ${proxies.length} proxies`);
  
  // Group by type
  const byType = proxies.reduce((acc, proxy) => {
    acc[proxy.type] = (acc[proxy.type] || 0) + 1;
    return acc;
  }, {});
  
  console.log('Proxies by type:', byType);
})();
```

---

### Shell Script for Monitoring

```bash
#!/bin/bash
# monitor-subscription.sh

SUB_URL="https://provider.com/subscription"
CONVERTER="https://your-worker.workers.dev"
ALERT_EMAIL="your@email.com"

# Fetch proxy count
COUNT=$(curl -s "${CONVERTER}/?url=${SUB_URL}&target=json" | jq '. | length')

echo "$(date): Found ${COUNT} proxies" >> /var/log/proxy-monitor.log

# Alert if count drops below threshold
if [ "$COUNT" -lt 10 ]; then
    echo "Warning: Only ${COUNT} proxies available!" | \
        mail -s "Proxy Alert" "$ALERT_EMAIL"
fi
```

---

## Best Practices

1. **Always test with `target=json` first**
   - Helps debug issues
   - Shows exact parsed data

2. **Use URL encoding for subscription URLs**
   - Prevents parsing errors
   - Handles special characters

3. **Cache aggressively**
   - Results cached for 1 hour
   - Don't poll too frequently

4. **Monitor subscription health**
   - Track proxy count over time
   - Alert on significant drops

5. **Keep backups**
   - Save working configurations
   - Have fallback subscriptions

---

**Need more examples?** Open an issue on GitHub!
