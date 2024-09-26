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
        ...ENVS.DEV
      },
      env_stag: {
        NODE_ENV: "stag",
        PORT: PORTS.STAG.ColaIntegration,
        NATS_CLIENT_ID: process.env.PM2_INSTANCE_ID ? `cola-integration-service-${process.env.PM2_INSTANCE_ID}` : 'cola-integration-service',
        ...ENVS.STAG
      },
      env_production: {
        NODE_ENV: "production",
        PORT: PORTS.DEV.ColaIntegration,
        NATS_CLIENT_ID: process.env.PM2_INSTANCE_ID ? `cola-integration-service-${process.env.PM2_INSTANCE_ID}` : 'cola-integration-service',
        ...ENVS.PROD
      },
    },
  ],
};
