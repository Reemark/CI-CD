const swaggerJsdoc = require("swagger-jsdoc");

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Todo API",
      version: "1.0.0",
    },
  },
  apis: ["./routes/*.js"],
};

let failures = 0;

function fail(message) {
  console.error(`  ✗ ${message}`);
  failures++;
}

function pass(message) {
  console.log(`  ✓ ${message}`);
}

function assertPath(paths, route) {
  if (!paths[route]) {
    fail(`Missing path in spec: ${route}`);
    return false;
  }
  pass(`Path exists: ${route}`);
  return true;
}

function assertMethod(paths, route, method, expectedCodes = []) {
  const operation = paths[route] && paths[route][method];
  if (!operation) {
    fail(`Missing ${method.toUpperCase()} ${route}`);
    return;
  }
  pass(`${method.toUpperCase()} ${route} is documented`);

  for (const code of expectedCodes) {
    if (!operation.responses || !operation.responses[code]) {
      fail(`${method.toUpperCase()} ${route} missing response ${code}`);
    } else {
      pass(`${method.toUpperCase()} ${route} has response ${code}`);
    }
  }
}

function assertRequestBody(paths, route, method) {
  const operation = paths[route] && paths[route][method];
  if (!operation) return;
  if (!operation.requestBody) {
    fail(`${method.toUpperCase()} ${route} missing requestBody`);
    return;
  }
  const content = operation.requestBody.content;
  if (!content || !content["application/json"]) {
    fail(`${method.toUpperCase()} ${route} requestBody must define application/json`);
    return;
  }
  pass(`${method.toUpperCase()} ${route} has requestBody with application/json`);
}

const spec = swaggerJsdoc(swaggerOptions);

console.log("\n=== API Contract Validation ===\n");

// 1. OpenAPI version
if (!spec.openapi || !String(spec.openapi).startsWith("3.")) {
  fail("OpenAPI version must be 3.x");
} else {
  pass(`OpenAPI version: ${spec.openapi}`);
}

const paths = spec.paths || {};

// 2. Required paths exist
assertPath(paths, "/todos");
assertPath(paths, "/todos/{id}");
assertPath(paths, "/todos/search/all");

// 3. Methods and response codes per path
assertMethod(paths, "/todos", "post", ["201", "422"]);
assertRequestBody(paths, "/todos", "post");

assertMethod(paths, "/todos", "get", ["200"]);

assertMethod(paths, "/todos/search/all", "get", ["200"]);

assertMethod(paths, "/todos/{id}", "get", ["200", "404"]);
assertMethod(paths, "/todos/{id}", "put", ["200", "404"]);
assertRequestBody(paths, "/todos/{id}", "put");
assertMethod(paths, "/todos/{id}", "delete", ["200", "404"]);

// 4. Summary/description on every operation
for (const [route, methods] of Object.entries(paths)) {
  for (const [method, operation] of Object.entries(methods)) {
    if (typeof operation !== "object" || !operation) continue;
    if (!operation.summary && !operation.description) {
      fail(`${method.toUpperCase()} ${route} is missing a summary or description`);
    } else {
      pass(`${method.toUpperCase()} ${route} has summary/description`);
    }
  }
}

console.log(`\n=== Result: ${failures} failure(s) ===\n`);
if (failures > 0) {
  process.exit(1);
}
