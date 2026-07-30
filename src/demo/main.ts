#!/usr/bin/env node
/**
 * `lumo demo` entry — prints what run-demo.ts produced.
 *
 * Split for the same reason as the scan: importing this module runs the demo
 * (the dispatcher relies on that side effect), so tests import run-demo.ts
 * instead and stay quiet.
 */

import { runDemo } from './run-demo.js';

for (const line of runDemo().lines) {
  console.log(line);
}
