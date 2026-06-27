import { testParserSuite } from "./parser.test.js";
import { testQuizSuite } from "./quiz.test.js";

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

const assert = {
  suite(name) {
    console.log(`\n=== Suite: ${name} ===`);
  },
  
  test(desc, fn) {
    totalTests++;
    try {
      fn();
      passedTests++;
      console.log(`  [PASS] ✓ ${desc}`);
    } catch (error) {
      failedTests++;
      console.error(`  [FAIL] ✗ ${desc}`);
      console.error(`         -> Error: ${error.message}`);
    }
  },

  equal(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(`${message || "Assertion failed"}: expected [${expected}] but got [${actual}]`);
    }
  },

  ok(value, message) {
    if (!value) {
      throw new Error(`${message || "Assertion failed"}: expected truthy value but got [${value}]`);
    }
  }
};

console.log("Running Japanese Study Tool Node Unit Tests...");
testParserSuite(assert);
testQuizSuite(assert);

console.log("\n=== Test Execution Summary ===");
console.log(`Total executed: ${totalTests} tests`);
console.log(`Passed:         ${passedTests} tests`);
console.log(`Failed:         ${failedTests} tests`);

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
