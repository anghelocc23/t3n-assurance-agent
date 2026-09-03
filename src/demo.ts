import { assessVendor } from "./policy.js";
import { demoScenarios } from "./scenarios.js";

for (const scenario of demoScenarios) {
  console.log(JSON.stringify(assessVendor(scenario)));
}

