const { PORTS, ENVS } = require('@ebazdev/core');

module.exports = {
  apps: [
    {
      name: "cola-integration",
      script: "./build/index.js",
      instances: 1,
      exec_mode: "cluster",
      env_development: {
        NODE_ENV: "development",
        PORT: PORTS.DEV.ColaIntegration,
        NATS_CLIENT_ID: process.env.PM2_INSTANCE_ID ? `cola-integration-service-${process.env.PM2_INSTANCE_ID}` : 'cola-integration-service',
        ...ENVS.DEV,
        COLA_OUTBOUND_USERNAME: "bazaar",
        COLA_OUTBOUND_PASSWORD: "M8@46jkljkjkljlk#$2024",
        COLA_BASE_URI: "http://122.201.28.22:8083",
        COLA_INBOUND_USERNAME: "coca-cola",
        COLA_INBOUND_PASSWORD: "wr!cuwr5WUjik*X$-ru#",
        COLA_INBOUND_ACCESS_TOKEN_SECRET: "S3bri?h@Ph?hesTL@iST"

      },
      env_stag: {
        NODE_ENV: "stag",
        PORT: PORTS.STAG.ColaIntegration,
        NATS_CLIENT_ID: process.env.PM2_INSTANCE_ID ? `cola-integration-service-${process.env.PM2_INSTANCE_ID}` : 'cola-integration-service',
        ...ENVS.STAG,
        COLA_OUTBOUND_USERNAME: "bazaar",
        COLA_OUTBOUND_PASSWORD: "M8@46jkljkjkljlk#$2024",
        COLA_BASE_URI: "http://122.201.28.22:8083",
        COLA_INBOUND_USERNAME: "coca-cola",
        COLA_INBOUND_PASSWORD: "wr!cuwr5WUjik*X$-ru#",
        COLA_INBOUND_ACCESS_TOKEN_SECRET: "S3bri?h@Ph?hesTL@iST"

      },
      env_production: {
        NODE_ENV: "production",
        PORT: PORTS.DEV.ColaIntegration,
        NATS_CLIENT_ID: process.env.PM2_INSTANCE_ID ? `cola-integration-service-${process.env.PM2_INSTANCE_ID}` : 'cola-integration-service',
        ...ENVS.PROD,
        COLA_OUTBOUND_USERNAME: "bazaar",
        COLA_OUTBOUND_PASSWORD: "M8@46jkljkjkljlk#$2024",
        COLA_BASE_URI: "http://122.201.28.22:8083",
        COLA_INBOUND_USERNAME: "coca-cola",
        COLA_INBOUND_PASSWORD: "wr!cuwr5WUjik*X$-ru#",
        COLA_INBOUND_ACCESS_TOKEN_SECRET: "S3bri?h@Ph?hesTL@iST"

      },
    },
  ],
};
