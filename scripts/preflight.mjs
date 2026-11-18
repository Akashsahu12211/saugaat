#!/usr/bin/env node
import 'dotenv/config';
import { validateDeploymentConfiguration } from '../src/lib/deployment-policy.ts';
const strict = process.argv.includes('--production');
const errors = validateDeploymentConfiguration(process.env, strict);
if (errors.length) {
  console.error('Saugaat deployment preflight failed:');
  for (const issue of errors) console.error(`- ${issue.key}: ${issue.reason}`);
  console.error('No secrets were printed. Fix configuration before deployment.');
  process.exitCode = 1;
} else {
  console.log(`Saugaat ${strict ? 'production' : 'development'} configuration checks passed.`);
  console.log('Reminder: this check does NOT verify database connectivity, cloud storage operations or payment approvals.');
}
