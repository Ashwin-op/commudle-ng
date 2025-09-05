import { stressOptions } from './config.js';
import { runTest } from './test-module.js';

export const options = stressOptions;

export default async function () {
  await runTest(true);
}
