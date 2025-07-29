const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

/**
 * Docker Environment Detection and Configuration Middleware
 */
class DockerMiddleware {
  constructor() {
    this.isDockerEnvironment = this.detectDockerEnvironment();
    this.containerInfo = this.getContainerInfo();
  }

  /**
   * Detect if running inside Docker container
   */
  detectDockerEnvironment() {
    try {
      // Check for .dockerenv file
      if (fs.existsSync('/.dockerenv')) {
        return true;
      }

      // Check cgroup for docker
      const cgroupPath = '/proc/1/cgroup';
      if (fs.existsSync(cgroupPath)) {
        const cgroup = fs.readFileSync(cgroupPath, 'utf8');
        return cgroup.includes('docker') || cgroup.includes('containerd');
      }

      // Check for common container environment variables
      const containerEnvVars = [
        'KUBERNETES_SERVICE_HOST',
        'DOCKER_CONTAINER',
        'container'
      ];

      return containerEnvVars.some(envVar => process.env[envVar]);
    } catch (error) {
      logger.warn('Error detecting Docker environment:', error.message);
      return false;
    }
  }

  /**
   * Get container information if available
   */
  getContainerInfo() {
    if (!this.isDockerEnvironment) {
      return null;
    }

    const info = {
      isContainer: true,
      hostname: process.env.HOSTNAME || 'unknown',
      containerName: process.env.CONTAINER_NAME || process.env.HOSTNAME || 'unknown'
    };

    // Try to get more detailed container info
    try {
      const hostnameFile = '/etc/hostname';
      if (fs.existsSync(hostnameFile)) {
        info.containerId = fs.readFileSync(hostnameFile, 'utf8').trim();
      }
    } catch (error) {
      logger.debug('Could not read container hostname:', error.message);
    }

    return info;
  }

  /**
   * Configure NPM API URL based on Docker environment
   */
  configureNpmApiUrl(defaultUrl) {
    if (!this.isDockerEnvironment) {
      return defaultUrl;
    }

    // In Docker, try to use service name first
    const serviceName = process.env.NPM_SERVICE_NAME || 'npm-backend';
    const port = process.env.NPM_INTERNAL_PORT || '81';
    
    // Check if we're in Docker Compose environment
    if (process.env.DOCKER_NETWORK) {
      const dockerUrl = `http://${serviceName}:${port}`;
      logger.info(`Docker environment detected, using service URL: ${dockerUrl}`);
      return dockerUrl;
    }

    // Fallback to provided URL
    return defaultUrl;
  }

  /**
   * Get Docker-aware CORS origins
   */
  getDockerCorsOrigins() {
    const origins = ['http://localhost:3000', 'http://localhost:5173'];

    if (this.isDockerEnvironment) {
      // Add container-specific origins
      origins.push(
        `http://${this.containerInfo?.hostname}:3000`,
        `http://${this.containerInfo?.hostname}:5173`
      );

      // Add Docker network origins if available
      if (process.env.DOCKER_NETWORK) {
        origins.push(
          `http://npmdeck-dev:5173`,
          `http://npmdeck-prod:3000`
        );
      }
    }

    return origins;
  }

  /**
   * Middleware function to add Docker context to requests
   */
  middleware() {
    return (req, res, next) => {
      // Add Docker context to request
      req.docker = {
        isContainer: this.isDockerEnvironment,
        containerInfo: this.containerInfo
      };

      // Add Docker-aware headers
      if (this.isDockerEnvironment) {
        res.setHeader('X-Container-Environment', 'true');
        res.setHeader('X-Container-Name', this.containerInfo?.containerName || 'unknown');
      }

      next();
    };
  }

  /**
   * Health check for Docker networking
   */
  async checkDockerNetworking() {
    if (!this.isDockerEnvironment) {
      return {
        docker: false,
        message: 'Not running in Docker environment'
      };
    }

    const checks = {
      environment: this.isDockerEnvironment,
      containerInfo: this.containerInfo,
      networkingChecks: {}
    };

    // Check DNS resolution for NPM service
    const serviceName = process.env.NPM_SERVICE_NAME || 'npm-backend';
    try {
      const dns = require('dns').promises;
      const addresses = await dns.lookup(serviceName);
      checks.networkingChecks.serviceResolution = {
        success: true,
        service: serviceName,
        addresses: addresses
      };
    } catch (error) {
      checks.networkingChecks.serviceResolution = {
        success: false,
        service: serviceName,
        error: error.message
      };
    }

    // Check if we can reach the NPM service
    const npmUrl = this.configureNpmApiUrl(process.env.NPM_API_URL);
    try {
      const axios = require('axios');
      const response = await axios.get(`${npmUrl}/api`, { timeout: 5000 });
      checks.networkingChecks.serviceConnectivity = {
        success: true,
        url: npmUrl,
        status: response.status
      };
    } catch (error) {
      checks.networkingChecks.serviceConnectivity = {
        success: false,
        url: npmUrl,
        error: error.message
      };
    }

    return checks;
  }

  /**
   * Get Docker environment summary
   */
  getEnvironmentSummary() {
    return {
      isDockerEnvironment: this.isDockerEnvironment,
      containerInfo: this.containerInfo,
      networkConfiguration: {
        networkName: process.env.DOCKER_NETWORK,
        serviceName: process.env.NPM_SERVICE_NAME,
        internalPort: process.env.NPM_INTERNAL_PORT
      },
      recommendedNpmUrl: this.configureNpmApiUrl(process.env.NPM_API_URL || 'http://localhost:81')
    };
  }
}

module.exports = new DockerMiddleware();