# ⚡ Quick Start Guide

Get up and running with Worker Subscription Converter in under 5 minutes!

## 🎯 TL;DR - Fastest Start

```bash
# Clone and setup
git clone https://github.com/RixGem/worker-subscription-converter.git
cd worker-subscription-converter
npm install

# Test locally
npm run dev

# Deploy to Cloudflare
npm run deploy
```

That's it! Your worker is now live. 🎉

---

## 📋 Prerequisites Checklist

- ✅ Node.js 18+ installed
- ✅ A Cloudflare account (free tier works)
- ✅ 5 minutes of your time

## 🚀 Step-by-Step Setup

### 1. Clone the Repository

```bash
git clone https://github.com/RixGem/worker-subscription-converter.git
cd worker-subscription-converter
```

### 2. Install Dependencies

```bash
npm install
```

This installs Wrangler CLI and other necessary tools.

### 3. Test Locally (Optional but Recommended)

```bash
npm run dev
```

Open your browser to: `http://localhost:8787`

You should see the usage page!

**Test the conversion:**

```bash
# In another terminal
curl "http://localhost:8787/?url=YOUR_SUBSCRIPTION&target=json"
```

### 4. Login to Cloudflare

```bash
npx wrangler login
```

This opens your browser to authenticate with Cloudflare.

### 5. Deploy!

```bash
npm run deploy
```

Done! You'll get a URL like: `https://worker-subscription-converter.your-username.workers.dev`

---

## 🎮 First Use

### Test Your Deployment

```bash
# Replace with your actual worker URL
WORKER_URL="https://worker-subscription-converter.your-username.workers.dev"

# Test the homepage
curl $WORKER_URL

# Test conversion (use a real subscription URL)
curl "$WORKER_URL/?url=YOUR_SUBSCRIPTION_URL&target=clash"
```

### Use in Clash

Set your subscription URL to:
```
https://worker-subscription-converter.your-username.workers.dev/?url=YOUR_ORIGINAL_SUBSCRIPTION&target=clash
```

### Use in Surge

Set your subscription URL to:
```
https://worker-subscription-converter.your-username.workers.dev/?url=YOUR_ORIGINAL_SUBSCRIPTION&target=surge
```

---

## 🔧 Basic Configuration

### Change Worker Name

Edit `wrangler.toml`:

```toml
name = "my-awesome-converter"  # Change this
```

Redeploy:

```bash
npm run deploy
```

### Add Custom Domain

1. Add domain to Cloudflare
2. Edit `wrangler.toml`:

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

---

## 📱 Usage Examples

### Example 1: Simple Conversion

```bash
curl "https://your-worker.workers.dev/?url=https://provider.com/sub&target=clash"
```

### Example 2: Merge Multiple Subscriptions

```bash
curl "https://your-worker.workers.dev/?url=SUB1&url=SUB2&url=SUB3&target=clash"
```

### Example 3: Debug Mode

```bash
curl "https://your-worker.workers.dev/?url=https://provider.com/sub&target=json"
```

---

## 🎓 Next Steps

### Learn More

- 📖 [Full Documentation](README.md)
- 💡 [Usage Examples](EXAMPLES.md)
- 🚀 [Deployment Guide](DEPLOYMENT.md)
- 🤝 [Contributing](CONTRIBUTING.md)

### Customize

1. **Edit IPv6 suffix**:
   ```javascript
   // In worker_to_sub.js
   IPV6_SUFFIX: '-ipv6'  // Change from '-v6'
   ```

2. **Change default output format**:
   ```javascript
   DEFAULT_TARGET: 'surge'  // Change from 'clash'
   ```

3. **Adjust timeout**:
   ```javascript
   FETCH_TIMEOUT: 15000  // Change from 10000ms
   ```

### Monitor

View live logs:
```bash
npm run tail
```

View in Cloudflare Dashboard:
1. Go to Workers & Pages
2. Click your worker
3. View Logs tab

---

## 🆘 Troubleshooting

### Worker won't start locally

```bash
# Try cleaning and reinstalling
rm -rf node_modules
npm install
npm run dev
```

### Can't login to Cloudflare

```bash
# Logout and try again
npx wrangler logout
npx wrangler login
```

### Deployment fails

```bash
# Check if you're logged in
npx wrangler whoami

# Check syntax
node -c worker_to_sub.js
```

### Worker returns errors

1. Check logs:
   ```bash
   npm run tail
   ```

2. Test with JSON output:
   ```bash
   curl "$WORKER_URL/?url=SUB&target=json"
   ```

3. Verify subscription URL is accessible:
   ```bash
   curl -I YOUR_SUBSCRIPTION_URL
   ```

---

## 💰 Cost

**Free Tier Includes:**
- ✅ 100,000 requests/day
- ✅ Unlimited bandwidth
- ✅ Global deployment
- ✅ SSL certificates

You won't pay anything unless you exceed the free tier!

---

## 🔐 Security Note

- ✅ No data is stored
- ✅ All processing happens on-the-fly
- ✅ HTTPS encrypted
- ⚠️ Use only trusted subscription URLs

---

## 🎉 You're All Set!

Your worker is now live and ready to convert subscriptions!

**Share your deployment:**
```bash
echo "My worker: https://worker-subscription-converter.your-username.workers.dev"
```

**Need help?** 
- 🐛 [Report Issues](https://github.com/RixGem/worker-subscription-converter/issues)
- 💬 [Discussions](https://github.com/RixGem/worker-subscription-converter/discussions)

---

## 🌟 Star the Project

If you find this useful, please consider giving it a star on GitHub!

[![GitHub stars](https://img.shields.io/github/stars/RixGem/worker-subscription-converter?style=social)](https://github.com/RixGem/worker-subscription-converter)

---

**Happy Converting! 🚀**
