#!/usr/bin/env node

/**
 * NPMDeck Setup Verification Script
 * Verifies that all API communication components are properly configured
 * and ready for production deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 NPMDeck API Setup Verification');
console.log('='.repeat(50));

const checks = [];

// Check 1: Required files exist
const requiredFiles = [
  'server/config/api.js',
  'server/utils/httpClient.js',
  'server/middleware/docker.js',
  'server/utils/apiMonitor.js',
  'server/routes/api-monitoring.js',
  '.env.production',
  '.env.development'
];

let allFilesExist = true;
requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  const exists = fs.existsSync(filePath);
  console.log(`${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allFilesExist = false;
});

checks.push({
  name: 'Required Files',
  status: allFilesExist ? 'PASS' : 'FAIL',
  details: `${requiredFiles.length} files checked`
});

// Check 2: Package.json dependencies
const packageJsonPath = path.join(__dirname, '..', 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const requiredDeps = [
    'express',
    'cors',
    'helmet',
    'http-proxy-middleware',
    'axios',
    'dotenv',
    'morgan'
  ];
  
  const missingDeps = requiredDeps.filter(dep => 
    !packageJson.dependencies[dep] && !packageJson.devDependencies[dep]
  );
  
  const hasDeps = missingDeps.length === 0;
  console.log(`${hasDeps ? '✅' : '❌'} Package Dependencies`);
  if (!hasDeps) {
    console.log(`   Missing: ${missingDeps.join(', ')}`);
  }
  
  checks.push({
    name: 'Package Dependencies',
    status: hasDeps ? 'PASS' : 'FAIL',
    details: `${requiredDeps.length - missingDeps.length}/${requiredDeps.length} dependencies found`
  });
} else {
  console.log('❌ package.json not found');
  checks.push({
    name: 'Package Dependencies',
    status: 'FAIL',
    details: 'package.json not found'
  });
}

// Check 3: Environment configuration
const envFiles = ['.env.production', '.env.development'];
let envConfigured = true;

envFiles.forEach(envFile => {
  const envPath = path.join(__dirname, '..', envFile);
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const requiredVars = [
      'NODE_ENV',
      'PORT',
      'NPM_API_URL',
      'REQUEST_TIMEOUT',
      'RETRY_ATTEMPTS'
    ];
    
    const missingVars = requiredVars.filter(varName => 
      !envContent.includes(`${varName}=`)
    );
    
    const hasAllVars = missingVars.length === 0;
    console.log(`${hasAllVars ? '✅' : '❌'} ${envFile} configuration`);
    if (!hasAllVars) {
      console.log(`   Missing: ${missingVars.join(', ')}`);
      envConfigured = false;
    }
  } else {
    console.log(`❌ ${envFile} not found`);
    envConfigured = false;
  }
});

checks.push({
  name: 'Environment Configuration',
  status: envConfigured ? 'PASS' : 'FAIL',
  details: `${envFiles.length} environment files checked`
});

// Check 4: Docker configuration
const dockerFiles = ['docker-compose.yml', 'Dockerfile'];
let dockerConfigured = true;

dockerFiles.forEach(dockerFile => {
  const dockerPath = path.join(__dirname, '..', dockerFile);
  const exists = fs.existsSync(dockerPath);
  console.log(`${exists ? '✅' : '❌'} ${dockerFile}`);
  if (!exists) dockerConfigured = false;
});

if (dockerConfigured) {
  const dockerComposePath = path.join(__dirname, '..', 'docker-compose.yml');
  const dockerComposeContent = fs.readFileSync(dockerComposePath, 'utf8');
  
  const requiredServices = ['npm-backend', 'npmdeck'];
  const hasNetworking = dockerComposeContent.includes('networks:');
  const hasHealthChecks = dockerComposeContent.includes('healthcheck:');
  
  console.log(`${hasNetworking ? '✅' : '❌'} Docker networking configured`);
  console.log(`${hasHealthChecks ? '✅' : '❌'} Health checks configured`);
}

checks.push({
  name: 'Docker Configuration',
  status: dockerConfigured ? 'PASS' : 'FAIL',
  details: `${dockerFiles.length} Docker files checked`
});

// Check 5: API configuration structure
const apiConfigPath = path.join(__dirname, '..', 'server/config/api.js');
if (fs.existsSync(apiConfigPath)) {
  const apiConfigContent = fs.readFileSync(apiConfigPath, 'utf8');
  const requiredFeatures = [
    'class APIConfig',
    'getProxyConfig',
    'getCorsConfig',
    'checkHealth',
    'timeout',
    'retry'
  ];
  
  const missingFeatures = requiredFeatures.filter(feature => 
    !apiConfigContent.includes(feature)
  );
  
  const hasAllFeatures = missingFeatures.length === 0;
  console.log(`${hasAllFeatures ? '✅' : '❌'} API Configuration Features`);
  if (!hasAllFeatures) {
    console.log(`   Missing: ${missingFeatures.join(', ')}`);
  }
  
  checks.push({
    name: 'API Configuration',
    status: hasAllFeatures ? 'PASS' : 'FAIL',
    details: `${requiredFeatures.length - missingFeatures.length}/${requiredFeatures.length} features found`
  });
} else {
  checks.push({
    name: 'API Configuration',
    status: 'FAIL',
    details: 'api.js not found'
  });
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 VERIFICATION SUMMARY');
console.log('='.repeat(50));

const passedChecks = checks.filter(check => check.status === 'PASS').length;
const totalChecks = checks.length;

checks.forEach(check => {
  const icon = check.status === 'PASS' ? '✅' : '❌';
  console.log(`${icon} ${check.name}: ${check.status} (${check.details})`);
});

console.log('\n' + '-'.repeat(50));
console.log(`Overall: ${passedChecks}/${totalChecks} checks passed`);

if (passedChecks === totalChecks) {
  console.log('🎉 All checks passed! Your NPMDeck API setup is ready for production.');
  console.log('\nNext steps:');
  console.log('1. Run: npm install (or pnpm install)');
  console.log('2. Test: npm run start');
  console.log('3. Docker: docker-compose up prod');
  process.exit(0);
} else {
  console.log('⚠️  Some checks failed. Please review the issues above.');
  console.log('\nRecommended actions:');
  console.log('1. Ensure all required files are present');
  console.log('2. Install missing dependencies');
  console.log('3. Configure environment variables');
  console.log('4. Run this script again to verify fixes');
  process.exit(1);
}