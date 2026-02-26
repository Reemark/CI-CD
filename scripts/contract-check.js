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

function fail(message) {
  console.error(`Contract validation failed: ${message}`);
  process.exit(1);
}

const spec = swaggerJsdoc(swaggerOptions);

if (!spec.openapi || !String(spec.openapi).startsWith("3.")) {
  fail("OpenAPI version must be 3.x");
}

const paths = spec.paths || {};
if (!paths["/todos"]) {
  fail("Missing /todos path in OpenAPI contract");
}
if (!paths["/todos/{id}"]) {
  fail("Missing /todos/{id} path in OpenAPI contract");
}

console.log("Contract validation passed for /todos and /todos/{id}.");
