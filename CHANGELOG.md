# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2024-02-24

### Added
- ✨ Complete rewrite with modern JavaScript practices
- ✅ IPv6 automatic detection and labeling with `-v6` suffix
- ✅ Support for VMess, VLESS, Trojan, Shadowsocks, ShadowsocksR
- ✅ Multiple output formats: Clash, Surge, JSON
- ✅ Comprehensive error handling and logging
- ✅ Base64 encoding/decoding with URL-safe support
- ✅ Subscription URL merging capability
- ✅ Request timeout handling (10 seconds)
- ✅ Response caching (1 hour)
- ✅ CORS support for web clients
- ✅ Beautiful web UI for usage instructions
- ✅ Detailed debug mode with JSON output
- 📝 Comprehensive documentation
  - README with full feature list
  - EXAMPLES.md with usage scenarios
  - DEPLOYMENT.md with step-by-step guide
  - CONTRIBUTING.md for contributors

### Changed
- 🔧 Improved code structure with clear separation of concerns
- 🔧 Enhanced proxy parsing with better error recovery
- 🔧 Optimized performance for large subscriptions
- 🔧 Better handling of malformed proxy URLs

### Security
- 🔒 Added input validation for URLs
- 🔒 Implemented fetch timeout to prevent hanging
- 🔒 No data storage or permanent logging

## [1.0.0] - 2024-01-15

### Added
- Initial release
- Basic subscription conversion
- VMess and Trojan support
- Clash format output

---

## Roadmap

### [2.1.0] - Planned
- [ ] Add subscription caching with KV storage
- [ ] Implement custom rule templates
- [ ] Add proxy health checking
- [ ] Support for encrypted subscriptions
- [ ] Geographic node grouping
- [ ] Advanced filtering options

### [3.0.0] - Future
- [ ] Web UI for configuration
- [ ] Real-time subscription updates via WebSocket
- [ ] Multi-user support with API keys
- [ ] Subscription analytics dashboard
- [ ] Custom protocol plugins

---

## Support

For questions or issues:
- 🐛 [Report Issues](https://github.com/RixGem/worker-subscription-converter/issues)
- 💬 [Discussions](https://github.com/RixGem/worker-subscription-converter/discussions)
