# About

Authority for the Waves decentralized applications

# Configuration

Copy `config/default.json` to `config/local-production.json` file and modify the settings according to the production environment.

# Running the Server

The suffix specified in the configuration filename suffix ("production" in case of `config/local-production.json`) should be passed to `index.js` via `NODE_ENV` environment variable:

```
NODE_ENV=production ./index.js
```
