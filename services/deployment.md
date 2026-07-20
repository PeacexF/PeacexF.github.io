# Deployment

I handle deployment and infrastructure end to end, not just the application code.

In practice, this covers:

* Docker and Docker Compose
* Web servers — Nginx, Apache, Caddy
* VPS setup, domain registration, Cloudflare
* CI/CD with GitHub Actions
* Security configuration and server hardening
* Email configuration
* Monitoring via Google and Yandex metrics

If a project needs to go from code to something running in production, reachable, and reasonably hardened, that's work I do myself rather than hand off.

See [Chelicera](../development/projects/chelicera.md)'s multi-service Docker Compose setup, or [Proxyc](../development/projects/proxyc.md)'s CI pipeline with static analysis and memory-safety verification, for examples of how I approach this.