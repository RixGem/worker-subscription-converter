/**
 * Cloudflare Workers Subscription Converter
 * 
 * This worker converts various proxy subscription formats to Clash/Surge format
 * with support for IPv6 node detection and proper error handling.
 * 
 * Supported Input Formats:
 * - VMess (vmess://)
 * - VLESS (vless://)
 * - Trojan (trojan://)
 * - Shadowsocks (ss://)
 * - ShadowsocksR (ssr://)
 * 
 * Supported Output Formats:
 * - Clash (YAML)
 * - Surge (configuration)
 * 
 * @author RixGem
 * @version 2.0.0
 */

// ==================== Configuration ====================

const CONFIG = {
  // Default target format if not specified
  DEFAULT_TARGET: 'clash',
  
  // Maximum subscription fetch timeout (ms)
  FETCH_TIMEOUT: 10000,
  
  // Enable debug logging
  DEBUG: false,
  
  // IPv6 detection patterns
  IPV6_PATTERNS: [
    /\[([0-9a-fA-F:]+)\]/,  // Bracketed IPv6: [2001:db8::1]
    /^([0-9a-fA-F]{0,4}:){7}[0-9a-fA-F]{0,4}$/  // Pure IPv6
  ],
  
  // Node name suffix for IPv6 nodes
  IPV6_SUFFIX: '-v6',
  
  // Clash template
  CLASH_TEMPLATE: {
    port: 7890,
    'socks-port': 7891,
    'allow-lan': true,
    mode: 'rule',
    'log-level': 'info',
    'external-controller': '0.0.0.0:9090',
    dns: {
      enable: true,
      nameserver: ['223.5.5.5', '1.1.1.1'],
      fallback: ['8.8.8.8', '1.0.0.1']
    }
  }
};

// ==================== Utility Functions ====================

/**
 * Logger utility with debug mode support
 */
const Logger = {
  debug: (...args) => CONFIG.DEBUG && console.log('[DEBUG]', ...args),
  info: (...args) => console.log('[INFO]', ...args),
  warn: (...args) => console.warn('[WARN]', ...args),
  error: (...args) => console.error('[ERROR]', ...args)
};

/**
 * Base64 encoding/decoding utilities
 * Handles both standard and URL-safe base64
 */
const Base64 = {
  /**
   * Decode base64 string (supports both standard and URL-safe)
   * @param {string} str - Base64 encoded string
   * @returns {string} Decoded string
   */
  decode: (str) => {
    try {
      // Replace URL-safe characters
      str = str.replace(/-/g, '+').replace(/_/g, '/');
      
      // Add padding if needed
      while (str.length % 4) {
        str += '=';
      }
      
      return atob(str);
    } catch (e) {
      Logger.error('Base64 decode error:', e.message);
      throw new Error('Invalid base64 string');
    }
  },
  
  /**
   * Encode string to base64
   * @param {string} str - String to encode
   * @returns {string} Base64 encoded string
   */
  encode: (str) => {
    try {
      return btoa(str);
    } catch (e) {
      Logger.error('Base64 encode error:', e.message);
      throw new Error('Base64 encoding failed');
    }
  },
  
  /**
   * Encode to URL-safe base64
   * @param {string} str - String to encode
   * @returns {string} URL-safe base64 string
   */
  encodeUrlSafe: (str) => {
    return Base64.encode(str)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }
};

/**
 * Check if an address is IPv6
 * @param {string} address - IP address or hostname
 * @returns {boolean} True if IPv6
 */
function isIPv6(address) {
  if (!address) return false;
  
  return CONFIG.IPV6_PATTERNS.some(pattern => pattern.test(address));
}

/**
 * Sanitize and format node name
 * @param {string} name - Original node name
 * @param {boolean} isV6 - Whether this is an IPv6 node
 * @returns {string} Formatted name
 */
function formatNodeName(name, isV6 = false) {
  if (!name) return 'Unnamed Node';
  
  // Remove special characters and trim
  let formatted = name.trim().replace(/[\r\n\t]/g, '');
  
  // Add IPv6 suffix if needed and not already present
  if (isV6 && !formatted.includes(CONFIG.IPV6_SUFFIX)) {
    formatted += ` ${CONFIG.IPV6_SUFFIX}`;
  }
  
  return formatted;
}

/**
 * Fetch content from URL with timeout
 * @param {string} url - URL to fetch
 * @returns {Promise<string>} Response text
 */
async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.FETCH_TIMEOUT);
  
  try {
    const response = await fetch(url, { 
      signal: controller.signal,
      headers: {
        'User-Agent': 'ClashForWindows/0.20.39'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.text();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

// ==================== Proxy Parsers ====================

/**
 * Parse VMess protocol
 * Format: vmess://base64(json)
 */
function parseVMess(url) {
  try {
    const content = url.replace('vmess://', '');
    const decoded = Base64.decode(content);
    const config = JSON.parse(decoded);
    
    const isV6 = isIPv6(config.add);
    
    return {
      type: 'vmess',
      name: formatNodeName(config.ps || config.name, isV6),
      server: config.add,
      port: parseInt(config.port) || 443,
      uuid: config.id,
      alterId: parseInt(config.aid) || 0,
      cipher: config.scy || 'auto',
      tls: config.tls === 'tls',
      network: config.net || 'tcp',
      'ws-opts': config.net === 'ws' ? {
        path: config.path || '/',
        headers: config.host ? { Host: config.host } : {}
      } : undefined,
      'h2-opts': config.net === 'h2' ? {
        host: config.host ? [config.host] : [],
        path: config.path || '/'
      } : undefined,
      'grpc-opts': config.net === 'grpc' ? {
        'grpc-service-name': config.path || ''
      } : undefined,
      sni: config.sni || config.host,
      'skip-cert-verify': config.verify_cert === false,
      isIPv6: isV6
    };
  } catch (e) {
    Logger.warn('VMess parse error:', e.message);
    return null;
  }
}

/**
 * Parse VLESS protocol
 * Format: vless://uuid@host:port?params#name
 */
function parseVLESS(url) {
  try {
    const urlObj = new URL(url);
    const server = urlObj.hostname;
    const isV6 = isIPv6(server);
    
    return {
      type: 'vless',
      name: formatNodeName(decodeURIComponent(urlObj.hash.slice(1)), isV6),
      server: server,
      port: parseInt(urlObj.port) || 443,
      uuid: urlObj.username,
      flow: urlObj.searchParams.get('flow') || '',
      network: urlObj.searchParams.get('type') || 'tcp',
      tls: urlObj.searchParams.get('security') === 'tls',
      sni: urlObj.searchParams.get('sni') || '',
      'skip-cert-verify': urlObj.searchParams.get('allowInsecure') === '1',
      'ws-opts': urlObj.searchParams.get('type') === 'ws' ? {
        path: urlObj.searchParams.get('path') || '/',
        headers: urlObj.searchParams.get('host') ? 
          { Host: urlObj.searchParams.get('host') } : {}
      } : undefined,
      isIPv6: isV6
    };
  } catch (e) {
    Logger.warn('VLESS parse error:', e.message);
    return null;
  }
}

/**
 * Parse Trojan protocol
 * Format: trojan://password@host:port?params#name
 */
function parseTrojan(url) {
  try {
    const urlObj = new URL(url);
    const server = urlObj.hostname;
    const isV6 = isIPv6(server);
    
    return {
      type: 'trojan',
      name: formatNodeName(decodeURIComponent(urlObj.hash.slice(1)), isV6),
      server: server,
      port: parseInt(urlObj.port) || 443,
      password: urlObj.username,
      sni: urlObj.searchParams.get('sni') || server,
      'skip-cert-verify': urlObj.searchParams.get('allowInsecure') === '1',
      network: urlObj.searchParams.get('type') || 'tcp',
      'ws-opts': urlObj.searchParams.get('type') === 'ws' ? {
        path: urlObj.searchParams.get('path') || '/',
        headers: urlObj.searchParams.get('host') ? 
          { Host: urlObj.searchParams.get('host') } : {}
      } : undefined,
      isIPv6: isV6
    };
  } catch (e) {
    Logger.warn('Trojan parse error:', e.message);
    return null;
  }
}

/**
 * Parse Shadowsocks protocol
 * Format: ss://base64(method:password)@host:port#name
 */
function parseShadowsocks(url) {
  try {
    let content = url.replace('ss://', '');
    let name = '';
    
    // Extract name if present
    if (content.includes('#')) {
      [content, name] = content.split('#');
      name = decodeURIComponent(name);
    }
    
    // Try to parse modern format first
    if (content.includes('@')) {
      const [userInfo, serverInfo] = content.split('@');
      const decoded = Base64.decode(userInfo);
      const [method, password] = decoded.split(':');
      const [server, port] = serverInfo.split(':');
      const isV6 = isIPv6(server);
      
      return {
        type: 'ss',
        name: formatNodeName(name || 'SS Node', isV6),
        server: server,
        port: parseInt(port) || 8388,
        cipher: method,
        password: password,
        isIPv6: isV6
      };
    } else {
      // Legacy format: ss://base64(all)
      const decoded = Base64.decode(content);
      const parts = decoded.match(/^(.+?):(.+)@(.+?):(\d+)$/);
      
      if (parts) {
        const isV6 = isIPv6(parts[3]);
        return {
          type: 'ss',
          name: formatNodeName(name || 'SS Node', isV6),
          server: parts[3],
          port: parseInt(parts[4]) || 8388,
          cipher: parts[1],
          password: parts[2],
          isIPv6: isV6
        };
      }
    }
  } catch (e) {
    Logger.warn('Shadowsocks parse error:', e.message);
  }
  return null;
}

/**
 * Parse ShadowsocksR protocol
 * Format: ssr://base64(params)
 */
function parseShadowsocksR(url) {
  try {
    const content = url.replace('ssr://', '');
    const decoded = Base64.decode(content);
    
    // SSR format: server:port:protocol:method:obfs:base64(password)/?params
    const mainPart = decoded.split('/?')[0];
    const params = decoded.split('/?')[1] || '';
    const parts = mainPart.split(':');
    
    if (parts.length < 6) return null;
    
    const server = parts[0];
    const isV6 = isIPv6(server);
    const paramObj = {};
    
    // Parse URL parameters
    params.split('&').forEach(param => {
      const [key, value] = param.split('=');
      if (key && value) {
        paramObj[key] = Base64.decode(value);
      }
    });
    
    return {
      type: 'ssr',
      name: formatNodeName(paramObj.remarks || 'SSR Node', isV6),
      server: server,
      port: parseInt(parts[1]) || 8388,
      protocol: parts[2],
      cipher: parts[3],
      obfs: parts[4],
      password: Base64.decode(parts[5]),
      'protocol-param': paramObj.protoparam || '',
      'obfs-param': paramObj.obfsparam || '',
      isIPv6: isV6
    };
  } catch (e) {
    Logger.warn('ShadowsocksR parse error:', e.message);
    return null;
  }
}

/**
 * Main proxy parser - detects type and calls appropriate parser
 */
function parseProxy(url) {
  if (!url || typeof url !== 'string') return null;
  
  url = url.trim();
  
  if (url.startsWith('vmess://')) return parseVMess(url);
  if (url.startsWith('vless://')) return parseVLESS(url);
  if (url.startsWith('trojan://')) return parseTrojan(url);
  if (url.startsWith('ss://')) return parseShadowsocks(url);
  if (url.startsWith('ssr://')) return parseShadowsocksR(url);
  
  Logger.debug('Unknown proxy protocol:', url.substring(0, 20));
  return null;
}

// ==================== Format Converters ====================

/**
 * Convert proxy node to Clash format
 */
function toClashProxy(proxy) {
  if (!proxy) return null;
  
  const base = {
    name: proxy.name,
    type: proxy.type,
    server: proxy.server,
    port: proxy.port
  };
  
  // Remove undefined values
  const cleaned = JSON.parse(JSON.stringify(base));
  
  // Add type-specific fields
  Object.keys(proxy).forEach(key => {
    if (!['type', 'name', 'server', 'port', 'isIPv6'].includes(key) && 
        proxy[key] !== undefined) {
      cleaned[key] = proxy[key];
    }
  });
  
  return cleaned;
}

/**
 * Convert proxy node to Surge format
 */
function toSurgeProxy(proxy) {
  if (!proxy) return null;
  
  let line = `${proxy.name} = ${proxy.type}, ${proxy.server}, ${proxy.port}`;
  
  switch (proxy.type) {
    case 'vmess':
    case 'vless':
      line += `, username=${proxy.uuid}`;
      if (proxy.tls) line += ', tls=true';
      if (proxy.sni) line += `, sni=${proxy.sni}`;
      if (proxy['skip-cert-verify']) line += ', skip-cert-verify=true';
      break;
      
    case 'trojan':
      line += `, password=${proxy.password}`;
      if (proxy.sni) line += `, sni=${proxy.sni}`;
      if (proxy['skip-cert-verify']) line += ', skip-cert-verify=true';
      break;
      
    case 'ss':
      line += `, encrypt-method=${proxy.cipher}, password=${proxy.password}`;
      break;
  }
  
  return line;
}

/**
 * Generate Clash configuration YAML
 */
function generateClashConfig(proxies) {
  const config = { ...CONFIG.CLASH_TEMPLATE };
  config.proxies = proxies.map(p => toClashProxy(p)).filter(Boolean);
  
  // Add proxy groups
  const proxyNames = config.proxies.map(p => p.name);
  config['proxy-groups'] = [
    {
      name: 'Proxy',
      type: 'select',
      proxies: ['Auto', 'DIRECT', ...proxyNames]
    },
    {
      name: 'Auto',
      type: 'url-test',
      proxies: proxyNames,
      url: 'http://www.gstatic.com/generate_204',
      interval: 300
    }
  ];
  
  // Add basic rules
  config.rules = [
    'DOMAIN-SUFFIX,google.com,Proxy',
    'DOMAIN-KEYWORD,google,Proxy',
    'GEOIP,CN,DIRECT',
    'MATCH,Proxy'
  ];
  
  // Convert to YAML format (simplified)
  return JSON.stringify(config, null, 2)
    .replace(/"/g, '')
    .replace(/,\n/g, '\n');
}

/**
 * Generate Surge configuration
 */
function generateSurgeConfig(proxies) {
  const lines = [
    '#!MANAGED-CONFIG interval=86400 strict=false',
    '',
    '[General]',
    'loglevel = notify',
    'skip-proxy = 127.0.0.1, 192.168.0.0/16, 10.0.0.0/8, 172.16.0.0/12, localhost, *.local',
    'dns-server = system, 223.5.5.5, 1.1.1.1',
    '',
    '[Proxy]',
    ...proxies.map(p => toSurgeProxy(p)).filter(Boolean),
    '',
    '[Proxy Group]',
    `Proxy = select, ${proxies.map(p => p.name).join(', ')}`,
    '',
    '[Rule]',
    'DOMAIN-SUFFIX,google.com,Proxy',
    'GEOIP,CN,DIRECT',
    'FINAL,Proxy'
  ];
  
  return lines.join('\n');
}

// ==================== Main Handler ====================

/**
 * Main request handler
 */
async function handleRequest(request) {
  const url = new URL(request.url);
  
  // Get parameters
  const target = url.searchParams.get('target') || CONFIG.DEFAULT_TARGET;
  const subUrls = url.searchParams.getAll('url');
  
  // Handle root path - show usage
  if (url.pathname === '/') {
    return new Response(getUsagePage(), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
  
  // Validate parameters
  if (subUrls.length === 0) {
    return new Response(
      JSON.stringify({ 
        error: 'No subscription URLs provided',
        usage: 'Add ?url=YOUR_SUBSCRIPTION_URL'
      }), 
      { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
  
  try {
    Logger.info(`Processing ${subUrls.length} subscription(s) for target: ${target}`);
    
    // Fetch all subscriptions
    const fetchPromises = subUrls.map(async (subUrl) => {
      try {
        const content = await fetchWithTimeout(subUrl);
        return content;
      } catch (e) {
        Logger.error(`Failed to fetch ${subUrl}:`, e.message);
        return '';
      }
    });
    
    const contents = await Promise.all(fetchPromises);
    
    // Parse all proxy URLs
    const allProxies = [];
    
    for (const content of contents) {
      if (!content) continue;
      
      // Try to decode if base64
      let decoded = content;
      try {
        decoded = Base64.decode(content);
      } catch (e) {
        // Not base64, use as-is
      }
      
      // Split by lines and parse each
      const lines = decoded.split(/\r?\n/);
      for (const line of lines) {
        const proxy = parseProxy(line);
        if (proxy) {
          allProxies.push(proxy);
        }
      }
    }
    
    Logger.info(`Successfully parsed ${allProxies.length} proxies`);
    
    // Log IPv6 statistics
    const ipv6Count = allProxies.filter(p => p.isIPv6).length;
    if (ipv6Count > 0) {
      Logger.info(`Found ${ipv6Count} IPv6 nodes`);
    }
    
    if (allProxies.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'No valid proxies found',
          message: 'Check your subscription URLs'
        }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Generate output based on target format
    let output, contentType;
    
    switch (target.toLowerCase()) {
      case 'clash':
        output = generateClashConfig(allProxies);
        contentType = 'application/x-yaml; charset=utf-8';
        break;
        
      case 'surge':
        output = generateSurgeConfig(allProxies);
        contentType = 'text/plain; charset=utf-8';
        break;
        
      case 'json':
        output = JSON.stringify(allProxies, null, 2);
        contentType = 'application/json; charset=utf-8';
        break;
        
      default:
        return new Response(
          JSON.stringify({ 
            error: 'Invalid target format',
            supported: ['clash', 'surge', 'json']
          }), 
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
    }
    
    return new Response(output, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (error) {
    Logger.error('Request handling error:', error.message);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Generate usage page HTML
 */
function getUsagePage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Subscription Converter</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 800px;
      margin: 50px auto;
      padding: 20px;
      line-height: 1.6;
      background: #f5f5f5;
    }
    .container {
      background: white;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 {
      color: #333;
      border-bottom: 3px solid #4CAF50;
      padding-bottom: 10px;
    }
    .feature {
      background: #e8f5e9;
      padding: 15px;
      margin: 15px 0;
      border-radius: 5px;
      border-left: 4px solid #4CAF50;
    }
    code {
      background: #f4f4f4;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
    }
    .endpoint {
      background: #fff3e0;
      padding: 15px;
      margin: 10px 0;
      border-radius: 5px;
      border-left: 4px solid #ff9800;
    }
    .example {
      background: #e3f2fd;
      padding: 15px;
      margin: 10px 0;
      border-radius: 5px;
      overflow-x: auto;
    }
    .warning {
      background: #fff3cd;
      padding: 15px;
      margin: 15px 0;
      border-radius: 5px;
      border-left: 4px solid #ffc107;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔄 Subscription Converter API</h1>
    
    <p>Convert various proxy subscription formats to Clash or Surge configuration.</p>
    
    <div class="feature">
      <h3>✨ Features</h3>
      <ul>
        <li>✅ Supports VMess, VLESS, Trojan, SS, SSR protocols</li>
        <li>✅ Automatic IPv6 node detection and labeling</li>
        <li>✅ Multiple subscription URL merging</li>
        <li>✅ Clash and Surge format output</li>
        <li>✅ Fast and reliable on Cloudflare Workers</li>
      </ul>
    </div>
    
    <h2>📡 API Endpoints</h2>
    
    <div class="endpoint">
      <h3>Convert Subscription</h3>
      <code>GET /?url=SUBSCRIPTION_URL&target=FORMAT</code>
    </div>
    
    <h3>Parameters:</h3>
    <ul>
      <li><code>url</code> - Subscription URL (can be used multiple times)</li>
      <li><code>target</code> - Output format: <code>clash</code> | <code>surge</code> | <code>json</code></li>
    </ul>
    
    <h2>📝 Examples</h2>
    
    <div class="example">
      <h4>Convert to Clash:</h4>
      <code>https://your-worker.workers.dev/?url=https://example.com/sub&target=clash</code>
    </div>
    
    <div class="example">
      <h4>Convert to Surge:</h4>
      <code>https://your-worker.workers.dev/?url=https://example.com/sub&target=surge</code>
    </div>
    
    <div class="example">
      <h4>Merge multiple subscriptions:</h4>
      <code>https://your-worker.workers.dev/?url=SUB1&url=SUB2&target=clash</code>
    </div>
    
    <div class="example">
      <h4>Get JSON format (for debugging):</h4>
      <code>https://your-worker.workers.dev/?url=https://example.com/sub&target=json</code>
    </div>
    
    <div class="warning">
      <h3>⚠️ Important Notes</h3>
      <ul>
        <li>Subscription URLs must be accessible from Cloudflare network</li>
        <li>IPv6 nodes will be automatically labeled with <code>-v6</code> suffix</li>
        <li>Results are cached for 1 hour for better performance</li>
        <li>Maximum fetch timeout is 10 seconds per subscription</li>
      </ul>
    </div>
    
    <h2>🛠️ IPv6 Detection</h2>
    <p>The converter automatically detects IPv6 addresses in proxy configurations and adds a <code>-v6</code> suffix to the node names. This helps identify which nodes use IPv6 connectivity.</p>
    
    <p style="margin-top: 30px; text-align: center; color: #666;">
      Made with ❤️ | Powered by Cloudflare Workers
    </p>
  </div>
</body>
</html>`;
}

// ==================== Worker Entry Point ====================

export default {
  async fetch(request) {
    return handleRequest(request);
  }
};
