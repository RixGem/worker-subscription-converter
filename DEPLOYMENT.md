# 🚀 Deployment Guide

Comprehensive guide for deploying the Worker Subscription Converter to Cloudflare Workers.

## Prerequisites

- ✅ Cloudflare account (free tier works)
- ✅ Node.js 18+ installed
- ✅ Git installed
- ✅ Basic command line knowledge

## Quick Deploy

### 1. Clone and Setup

```bash
# Clone repository
git clone https://github.com/RixGem/worker-subscription-converter.git
cd worker-subscription-converter

# Install dependencies
npm install
```

### 2. Login to Cloudflare

```bash
npx wrangler login
```

This will open your browser to authenticate with Cloudflare.

### 3. Deploy

```bash
npm run deploy
```

That's it! Your worker is now live.

## Detailed Deployment

### Step 1: Cloudflare Account Setup

1. **Create Account**
   - Go to [Cloudflare](https://dash.cloudflare.com/sign-up)
   - Sign up for free
   - Verify your email

2. **Get Account ID**
   ```bash
   # After login
   wrangler whoami
   ```

### Step 2: Configure wrangler.toml

Edit `wrangler.toml`:

```toml
name = "my-subscription-converter"  # Change this to your preferred name
main = "worker_to_sub.js"
compatibility_date = "2024-01-01"

# Optional: Add your account ID
account_id = "your-account-id-here"
```

### Step 3: Development Testing

Test locally before deploying:

```bash
# Start local dev server
npm run dev

# Test in another terminal
curl "http://localhost:8787/"
```

### Step 4: Deploy to Production

```bash
# Deploy to production
npm run deploy

# You'll get a URL like:
# https://my-subscription-converter.your-subdomain.workers.dev
```

### Step 5: Test Deployment

```bash
# Test the live worker
curl "https://my-subscription-converter.your-subdomain.workers.dev/"

# Should return the usage page
```

## Environment Configuration

### Development Environment

```bash
# Deploy to dev environment
npm run deploy:dev

# URL will be:
# https://my-subscription-converter-dev.your-subdomain.workers.dev
```

### Production Environment

```bash
# Deploy to production
npm run deploy:prod

# Can configure custom domain here
```

## Custom Domain Setup

### Option 1: Workers.dev Subdomain

**Free, provided by Cloudflare:**

1. Choose your subdomain during first deployment
2. URL format: `https://your-choice.workers.dev`
3. Can be changed in Cloudflare dashboard

### Option 2: Custom Domain

**Requirements:**
- Domain managed by Cloudflare
- DNS configured

**Steps:**

1. **Add domain to Cloudflare**
   - Add site in Cloudflare dashboard
   - Update nameservers
   - Wait for DNS propagation

2. **Configure in wrangler.toml**

```toml
[env.production]
name = "worker-subscription-converter"
routes = [
  { pattern = "sub.yourdomain.com/*", zone_name = "yourdomain.com" }
]
```

3. **Deploy**

```bash
npm run deploy:prod
```

4. **Verify**

```bash
curl "https://sub.yourdomain.com/"
```

### Option 3: Multiple Custom Domains

```toml
[env.production]
routes = [
  { pattern = "sub.domain1.com/*", zone_name = "domain1.com" },
  { pattern = "api.domain2.com/sub/*", zone_name = "domain2.com" },
  { pattern = "convert.domain3.com/*", zone_name = "domain3.com" }
]
```

## Environment Variables

Add environment variables for different configs:

### Method 1: In wrangler.toml

```toml
[vars]
DEBUG = "false"
DEFAULT_TARGET = "clash"
```

### Method 2: Using Secrets

For sensitive data:

```bash
# Add a secret
wrangler secret put API_KEY
# Enter value when prompted

# Use in code
export default {
  async fetch(request, env) {
    const apiKey = env.API_KEY;
    // ...
  }
};
```

## Monitoring and Logs

### View Live Logs

```bash
# Tail logs in real-time
npm run tail

# Or with wrangler directly
wrangler tail my-subscription-converter
```

### View in Dashboard

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Select "Workers & Pages"
3. Click on your worker
4. View "Logs" tab

### Enable Analytics

```toml
[observability]
logs.enabled = true
```

View analytics in Cloudflare dashboard:
- Request count
- Error rate
- Response time
- Geographic distribution

## Performance Optimization

### 1. Enable Caching

Add to response headers:

```javascript
return new Response(output, {
  headers: {
    'Cache-Control': 'public, max-age=3600',  // Cache for 1 hour
    'CDN-Cache-Control': 'public, max-age=7200'  // CDN caches for 2 hours
  }
});
```

### 2. Optimize Response Size

```javascript
// Minify JSON responses
JSON.stringify(data);  // Instead of JSON.stringify(data, null, 2)
```

### 3. Use Durable Objects (Advanced)

For persistent caching:

```toml
[[durable_objects.bindings]]
name = "CACHE"
class_name = "SubscriptionCache"
script_name = "worker-subscription-converter"
```

## CI/CD Setup

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare Workers

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    name: Deploy
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Deploy to Cloudflare Workers
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          command: deploy --env production
```

**Setup:**

1. Get Cloudflare API Token:
   - Go to Cloudflare Dashboard
   - My Profile → API Tokens
   - Create Token → Edit Cloudflare Workers

2. Add to GitHub Secrets:
   - Repository Settings → Secrets
   - Add `CLOUDFLARE_API_TOKEN`

3. Push to main branch:
   ```bash
   git push origin main
   # Auto-deploys via GitHub Actions
   ```

### GitLab CI

Create `.gitlab-ci.yml`:

```yaml
stages:
  - deploy

deploy:production:
  stage: deploy
  image: node:18
  only:
    - main
  script:
    - npm ci
    - npm install -g wrangler
    - wrangler deploy --env production
  variables:
    CLOUDFLARE_API_TOKEN: $CLOUDFLARE_API_TOKEN
```

## Updating the Worker

### Manual Update

```bash
# Pull latest changes
git pull origin main

# Install any new dependencies
npm install

# Deploy
npm run deploy
```

### Automatic Updates

**Option 1: GitHub Actions (see CI/CD above)**

**Option 2: Renovate Bot**

Add `renovate.json`:

```json
{
  "extends": ["config:base"],
  "automerge": true
}
```

## Rollback Procedure

### Using Wrangler

```bash
# List deployments
wrangler deployments list

# Rollback to previous
wrangler rollback [DEPLOYMENT_ID]
```

### Using Git

```bash
# Revert to previous commit
git revert HEAD
git push origin main

# If using CI/CD, this will auto-deploy the reverted version
```

## Troubleshooting

### Issue: "Authentication Error"

**Solution:**
```bash
# Re-authenticate
wrangler logout
wrangler login
```

### Issue: "Account ID not found"

**Solution:**
```bash
# Get account ID
wrangler whoami

# Add to wrangler.toml
account_id = "your-account-id"
```

### Issue: "Rate Limited"

**Solution:**
- Free tier: 100,000 requests/day
- Upgrade to paid plan for more
- Implement request throttling

### Issue: "Worker Size Too Large"

**Solution:**
- Maximum size: 1MB
- Minify code:
  ```bash
  npm install -g terser
  terser worker_to_sub.js -o worker_to_sub.min.js
  ```
- Update wrangler.toml:
  ```toml
  main = "worker_to_sub.min.js"
  ```

## Security Best Practices

### 1. API Token Security

```bash
# Never commit tokens to git
echo "wrangler.toml" >> .gitignore  # If it contains secrets

# Use environment variables
export CLOUDFLARE_API_TOKEN="your-token"
```

### 2. Rate Limiting

Implement in worker:

```javascript
// Simple rate limiting
const rateLimiter = {
  async check(request) {
    const ip = request.headers.get('CF-Connecting-IP');
    // Implement rate limit logic
  }
};
```

### 3. Input Validation

Always validate:
- URL parameters
- Subscription URLs
- User input

## Cost Estimation

### Free Tier
- ✅ 100,000 requests/day
- ✅ Unlimited bandwidth
- ✅ 10ms CPU time per request

### Paid Tier ($5/month)
- ✅ 10 million requests/month included
- ✅ $0.50 per additional million
- ✅ 50ms CPU time per request

### Enterprise
- Contact Cloudflare for pricing
- Custom limits
- SLA guarantees

## Support

- 📖 [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- 💬 [Community Forum](https://community.cloudflare.com/)
- 🐛 [Report Issues](https://github.com/RixGem/worker-subscription-converter/issues)

---

**Ready to deploy?** Run `npm run deploy` now!
