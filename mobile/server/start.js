#!/usr/bin/env node

/**
 * Dietician Frontend Server Startup Script
 * Starts Expo web server with proper logging to port-numbered log files
 */

const { spawn } = require('child_process');
const path = require('path');

const { logger, PORT } = require('./logger');

logger.info(`Starting Dietician Frontend Server on port ${PORT}`);
logger.info(`Logs will be written to /var/log/dietician/dietician-${PORT}.log`);

// Set environment variables
process.env.FRONTEND_PORT = PORT;
process.env.LOG_DIR = '/var/log/dietician';
process.env.EXPO_PORT = PORT;

// Start expo with web flag
const expo = spawn('npx', ['expo', 'start', '--web', '--clear'], {
  cwd: path.join(__dirname, '..'),
  stdio: ['ignore', 'pipe', 'pipe'],
  env: { ...process.env }
});

// Capture stdout and log it
expo.stdout.on('data', (data) => {
  const lines = data.toString().split('\n').filter(line => line.trim());
  lines.forEach(line => {
    // Filter out repetitive logs
    if (!line.includes('Logs will appear in the browser console') &&
        !line.includes('Bundled') &&
        !line.includes('Web ./index.ts')) {
      logger.info(line);
    }
  });
});

// Capture stderr and log it as error
expo.stderr.on('data', (data) => {
  const lines = data.toString().split('\n').filter(line => line.trim());
  lines.forEach(line => {
    if (line.toLowerCase().includes('error') || line.toLowerCase().includes('warn')) {
      logger.error(line);
    } else {
      logger.warn(line);
    }
  });
});

// Handle process exit
expo.on('close', (code) => {
  logger.info(`Expo process exited with code ${code}`);
  process.exit(code);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  expo.kill('SIGTERM');
});

process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  expo.kill('SIGTERM');
});

// Keep the process alive
setInterval(() => {
  if (expo.killed) {
    logger.error('Expo process was killed unexpectedly');
    process.exit(1);
  }
}, 5000);
