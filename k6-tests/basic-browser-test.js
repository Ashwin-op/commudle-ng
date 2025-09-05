import { defaultOptions } from './config.js';
import { runTest } from './test-module.js';

export const options = defaultOptions;

export default async function () {
  await runTest(false);
}
