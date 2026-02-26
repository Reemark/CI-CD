const express = require("express");
const Sentry = require("@sentry/node");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const todoRouter = require("./routes/todo");

const app = express();
app.use(express.json());

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || "0.1"),
    environment: process.env.NODE_ENV || "development",
  });
}

// Configuration Swagger
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Todo API",
      version: "1.0.0",
      description: "API de gestion de todos",
    },
  },
  apis: ["./routes/*.js"], // Swagger va lire les commentaires dans les fichiers de routes
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/", (_req, res) => {
  console.log("someone hit the root endpoint");
  res.json({ message: "Welcome to the Enhanced Express Todo App!" });
});

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/todos", todoRouter);

app.use((err, _req, res, _next) => {
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(err);
  }
  console.error(err);
  if (res.headersSent) {
    return;
  }
  res.status(500).json({ error: "Internal Server Error" });
});

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

module.exports = app;
