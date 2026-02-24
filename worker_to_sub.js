/**
 * Cloudflare Worker - Optimized IP Subscription Generator
 * Fetches best Cloudflare IPs with HKG/SIN prioritization
 * Supports IPv4/IPv6 dual stack with performance-based sorting
 */

const API_URL = 'https://api.4ce.cn/api/bestCFIP';
const PRIORITY_REGIONS = ['HKG', 'SIN'];
const OPERATOR_MAP = {
  '移动': 'CM',
  '联通': 'CU',
  '电信': 'CT'
};

/**
 * Main request handler
 */
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  try {
    const url = new URL(request.url);
    const format = url.searchParams.get('format') || 'v2ray';
    
    // Fetch and process IPs
    const preferredIps = await getPreferredIps();
    
    // Generate subscription based on format
    let response;
    switch (format.toLowerCase()) {
      case 'clash':
        response = generateClashSubscription(preferredIps);
        break;
      case 'surge':
        response = generateSurgeSubscription(preferredIps);
        break;
      case 'v2ray':
      default:
        response = generateV2raySubscription(preferredIps);
        break;
    }
    
    return new Response(response, {
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300'
      }
    });
  } catch (error) {
    return new Response(`Error: ${error.message}`, { 
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

/**
 * Fetch and process preferred IPs from API
 * Returns sorted array with priority: HKG/SIN optimized > Operator IPs > Backup IPs
 */
async function getPreferredIps() {
  try {
    const response = await fetch(API_URL, {
      headers: {
        'User-Agent': 'Cloudflare-Worker/1.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data)) {
      throw new Error('Invalid API response format');
    }
    
    // Process and categorize IPs
    const processed = data.map(entry => processIPEntry(entry));
    const categorized = categorizeIPs(processed);
    
    // Sort within each category
    categorized.priorityRegions.sort(comparePerformance);
    categorized.operatorIPs.sort(comparePerformance);
    categorized.backupIPs.sort(comparePerformance);
    
    // Combine in priority order
    return [
      ...categorized.priorityRegions,
      ...categorized.operatorIPs,
      ...categorized.backupIPs
    ];
  } catch (error) {
    console.error('Error fetching IPs:', error);
    throw error;
  }
}

/**
 * Process individual IP entry
 */
function processIPEntry(entry) {
  return {
    name: entry.name || 'Unknown',
    ip: entry.ip,
    colo: entry.colo || 'Unknown',
    latency: entry.latency || null,
    speed: entry.speed || 0,
    uptime: entry.uptime || '',
    isIPv6: isIPv6Address(entry.ip),
    operator: getOperatorCode(entry.name)
  };
}

/**
 * Categorize IPs into priority groups
 */
function categorizeIPs(ips) {
  const categories = {
    priorityRegions: [],
    operatorIPs: [],
    backupIPs: []
  };
  
  for (const ip of ips) {
    if (PRIORITY_REGIONS.includes(ip.colo)) {
      categories.priorityRegions.push(ip);
    } else if (ip.operator) {
      categories.operatorIPs.push(ip);
    } else {
      categories.backupIPs.push(ip);
    }
  }
  
  return categories;
}

/**
 * Compare function for sorting by performance
 * Priority: latency (lower better) > speed (higher better)
 * Handle null/missing latency gracefully
 */
function comparePerformance(a, b) {
  // If both have latency, compare by latency first
  if (a.latency !== null && b.latency !== null) {
    if (a.latency !== b.latency) {
      return a.latency - b.latency; // Lower latency is better
    }
    // If latency is equal, compare by speed
    return b.speed - a.speed; // Higher speed is better
  }
  
  // If only one has latency, prefer the one with latency
  if (a.latency !== null) return -1;
  if (b.latency !== null) return 1;
  
  // If neither has latency, compare by speed only
  return b.speed - a.speed;
}

/**
 * Check if address is IPv6
 */
function isIPv6Address(ip) {
  return ip.includes(':');
}

/**
 * Get operator code from name
 */
function getOperatorCode(name) {
  return OPERATOR_MAP[name] || null;
}

/**
 * Generate node name with proper formatting
 */
function generateNodeName(ip, protocol = 'WS') {
  const prefix = 'Edgesky';
  const regionCode = ip.colo;
  const ipVersion = ip.isIPv6 ? 'v6' : 'v4';
  const optimizedTag = PRIORITY_REGIONS.includes(ip.colo) ? 'Optimized' : '';
  
  // Examples: Edgesky-WS-HK-Optimized, Edgesky-gRPC-SG-v6
  let nameParts = [prefix, protocol, regionCode];
  
  if (optimizedTag) {
    nameParts.push(optimizedTag);
  } else if (!ip.isIPv6) {
    // Only add IP version tag for non-priority regions or IPv6
    nameParts.push(ipVersion);
  }
  
  if (ip.isIPv6 && !optimizedTag) {
    nameParts.push(ipVersion);
  }
  
  return nameParts.join('-');
}

/**
 * Generate V2Ray subscription format (Base64 encoded vmess/vless links)
 */
function generateV2raySubscription(ips) {
  const configs = ips.slice(0, 50).map((ip, index) => {
    const config = {
      v: '2',
      ps: generateNodeName(ip, 'WS'),
      add: ip.ip,
      port: '443',
      id: 'YOUR-UUID-HERE', // Replace with actual UUID
      aid: '0',
      net: 'ws',
      type: 'none',
      host: 'your-domain.com', // Replace with actual domain
      path: '/ws',
      tls: 'tls',
      sni: 'your-domain.com'
    };
    
    const vmessLink = 'vmess://' + btoa(JSON.stringify(config));
    return vmessLink;
  });
  
  return btoa(configs.join('\n'));
}

/**
 * Generate Clash subscription format (YAML)
 */
function generateClashSubscription(ips) {
  const proxies = ips.slice(0, 50).map((ip, index) => {
    return `  - name: "${generateNodeName(ip, 'WS')}"
    type: vmess
    server: ${ip.ip}
    port: 443
    uuid: YOUR-UUID-HERE
    alterId: 0
    cipher: auto
    tls: true
    skip-cert-verify: false
    servername: your-domain.com
    network: ws
    ws-opts:
      path: /ws
      headers:
        Host: your-domain.com`;
  });
  
  const proxyNames = ips.slice(0, 50).map(ip => `      - "${generateNodeName(ip, 'WS')}"`);
  
  return `# Edgesky Optimized Clash Configuration
# Generated: ${new Date().toISOString()}

proxies:
${proxies.join('\n')}

proxy-groups:
  - name: "🚀 Proxy"
    type: select
    proxies:
${proxyNames.join('\n')}
  
  - name: "♻️ Auto"
    type: url-test
    url: http://www.gstatic.com/generate_204
    interval: 300
    proxies:
${proxyNames.join('\n')}
  
  - name: "🇭🇰 Hong Kong"
    type: url-test
    url: http://www.gstatic.com/generate_204
    interval: 300
    proxies:
${ips.filter(ip => ip.colo === 'HKG').slice(0, 20).map(ip => `      - "${generateNodeName(ip, 'WS')}"`).join('\n')}
  
  - name: "🇸🇬 Singapore"
    type: url-test
    url: http://www.gstatic.com/generate_204
    interval: 300
    proxies:
${ips.filter(ip => ip.colo === 'SIN').slice(0, 20).map(ip => `      - "${generateNodeName(ip, 'WS')}"`).join('\n')}

rules:
  - DOMAIN-SUFFIX,google.com,🚀 Proxy
  - DOMAIN-KEYWORD,google,🚀 Proxy
  - DOMAIN-SUFFIX,youtube.com,🚀 Proxy
  - DOMAIN-SUFFIX,facebook.com,🚀 Proxy
  - DOMAIN-SUFFIX,twitter.com,🚀 Proxy
  - GEOIP,CN,DIRECT
  - MATCH,🚀 Proxy`;
}

/**
 * Generate Surge subscription format
 */
function generateSurgeSubscription(ips) {
  const proxies = ips.slice(0, 50).map((ip, index) => {
    const name = generateNodeName(ip, 'WS');
    return `${name} = vmess, ${ip.ip}, 443, username=YOUR-UUID-HERE, ws=true, ws-path=/ws, ws-headers=Host:"your-domain.com", tls=true, sni=your-domain.com`;
  });
  
  const proxyList = ips.slice(0, 50).map(ip => generateNodeName(ip, 'WS')).join(', ');
  const hkProxies = ips.filter(ip => ip.colo === 'HKG').slice(0, 20).map(ip => generateNodeName(ip, 'WS')).join(', ');
  const sgProxies = ips.filter(ip => ip.colo === 'SIN').slice(0, 20).map(ip => generateNodeName(ip, 'WS')).join(', ');
  
  return `#!MANAGED-CONFIG https://your-worker.workers.dev/?format=surge interval=86400 strict=true

[General]
loglevel = notify
dns-server = 223.5.5.5, 114.114.114.114, system

[Proxy]
${proxies.join('\n')}

[Proxy Group]
🚀 Proxy = select, ${proxyList}
♻️ Auto = url-test, ${proxyList}, url = http://www.gstatic.com/generate_204, interval = 300
🇭🇰 Hong Kong = url-test, ${hkProxies}, url = http://www.gstatic.com/generate_204, interval = 300
🇸🇬 Singapore = url-test, ${sgProxies}, url = http://www.gstatic.com/generate_204, interval = 300

[Rule]
DOMAIN-SUFFIX,google.com,🚀 Proxy
DOMAIN-KEYWORD,google,🚀 Proxy
DOMAIN-SUFFIX,youtube.com,🚀 Proxy
DOMAIN-SUFFIX,facebook.com,🚀 Proxy
DOMAIN-SUFFIX,twitter.com,🚀 Proxy
GEOIP,CN,DIRECT
FINAL,🚀 Proxy`;
}

/**
 * Base64 encode function (for environments without btoa)
 */
function btoa(str) {
  return Buffer.from(str).toString('base64');
}

/**
 * Export for testing
 */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getPreferredIps,
    processIPEntry,
    categorizeIPs,
    comparePerformance,
    generateNodeName,
    isIPv6Address,
    getOperatorCode
  };
}
