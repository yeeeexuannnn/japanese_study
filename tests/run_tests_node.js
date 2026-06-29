import { testParserSuite } from "./parser.test.js";
import { testQuizSuite } from "./quiz.test.js";
import { testVerbParserSuite } from "./verb_parser.test.js";
import { testVerbQuizSuite } from "./verb_quiz.test.js";
import { testStorageSuite } from "./storage.test.js";
import { validateVocabularyFile } from "../.agents/skills/vocabulary_validator/scripts/validate_vocab.js";
import { validateVerbsFile } from "../.agents/skills/vocabulary_validator/scripts/validate_verbs.js";
import path from "path";
import { fileURLToPath } from "url";

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
testVerbParserSuite(assert);
testVerbQuizSuite(assert);
testStorageSuite(assert);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const vocabPath = path.resolve(__dirname, "../specs/vocabulary_list.md");
const verbsPath = path.resolve(__dirname, "../specs/verb_conjugation_list.md");

assert.suite("Vocabulary List Grammar & Format Validation");
assert.test("vocabulary_list.md should be grammatically and structurally correct", () => {
  const errors = validateVocabularyFile(vocabPath);
  if (errors.length > 0) {
    throw new Error(`\n` + errors.join("\n"));
  }
});

assert.suite("Verb Conjugation List Grammar & Format Validation");
assert.test("verb_conjugation_list.md should be grammatically and structurally correct", () => {
  const errors = validateVerbsFile(verbsPath);
  if (errors.length > 0) {
    throw new Error(`\n` + errors.join("\n"));
  }
});

console.log("\n=== Test Execution Summary ===");
console.log(`Total executed: ${totalTests} tests`);
console.log(`Passed:         ${passedTests} tests`);
console.log(`Failed:         ${failedTests} tests`);

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
