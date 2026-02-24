const fs = require("fs");
const path = require("path");
const request = require("supertest");
const app = require("../app");
const { resetDb } = require("../database/database");

const TEST_DB_PATH = path.join(__dirname, "todo.test.db");

function cleanupDbFile() {
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }
}

beforeAll(() => {
  process.env.TODO_DB_PATH = TEST_DB_PATH;
});

beforeEach(() => {
  resetDb();
  cleanupDbFile();
});

afterAll(() => {
  resetDb();
  cleanupDbFile();
  delete process.env.TODO_DB_PATH;
});

describe("Todo API", () => {
  test("GET / returns welcome message", async () => {
    const response = await request(app).get("/");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: "Welcome to the Enhanced Express Todo App!"
    });
  });

  test("GET /health returns 200", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });

  test("POST /todos returns 422 if title is missing", async () => {
    const response = await request(app).post("/todos").send({ description: "x" });

    expect(response.status).toBe(422);
    expect(response.body).toEqual({ detail: "title is required" });
  });

  test("CRUD flow works and handles not found branches", async () => {
    const createResponse = await request(app)
      .post("/todos")
      .send({ title: "Task A", description: "Desc", status: "pending" });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.title).toBe("Task A");
    const createdId = createResponse.body.id;

    const getResponse = await request(app).get(`/todos/${createdId}`);
    expect(getResponse.status).toBe(200);
    expect(getResponse.body.id).toBe(createdId);

    const listResponse = await request(app).get("/todos?skip=0&limit=10");
    expect(listResponse.status).toBe(200);
    expect(Array.isArray(listResponse.body)).toBe(true);
    expect(listResponse.body.length).toBe(1);

    const searchResponse = await request(app).get("/todos/search/all?q=Task");
    expect(searchResponse.status).toBe(200);
    expect(searchResponse.body.length).toBe(1);
    expect(searchResponse.body[0].title).toBe("Task A");

    const updateResponse = await request(app)
      .put(`/todos/${createdId}`)
      .send({ status: "done", title: "Task A updated" });
    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.status).toBe("done");
    expect(updateResponse.body.title).toBe("Task A updated");

    const deleteResponse = await request(app).delete(`/todos/${createdId}`);
    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body).toEqual({ detail: "Todo deleted" });

    const getDeletedResponse = await request(app).get(`/todos/${createdId}`);
    expect(getDeletedResponse.status).toBe(404);
    expect(getDeletedResponse.body).toEqual({ detail: "Todo not found" });

    const updateMissingResponse = await request(app).put("/todos/99999").send({ title: "x" });
    expect(updateMissingResponse.status).toBe(404);
    expect(updateMissingResponse.body).toEqual({ detail: "Todo not found" });

    const deleteMissingResponse = await request(app).delete("/todos/99999");
    expect(deleteMissingResponse.status).toBe(404);
    expect(deleteMissingResponse.body).toEqual({ detail: "Todo not found" });
  });

  test("PUT /todos/:id keeps existing fields when not provided", async () => {
    const createResponse = await request(app)
      .post("/todos")
      .send({ title: "Original Title", description: "Original Desc", status: "pending" });
    const id = createResponse.body.id;

    // Only update status — title and description should fall back to existing values
    const updateResponse = await request(app)
      .put(`/todos/${id}`)
      .send({ status: "done" });
    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.title).toBe("Original Title");
    expect(updateResponse.body.description).toBe("Original Desc");
    expect(updateResponse.body.status).toBe("done");
  });

  test("loads existing database file on reconnect", async () => {
    // Create a todo so the DB file gets written to disk
    await request(app).post("/todos").send({ title: "Persistent Todo" });

    // Reset in-memory db but keep the file on disk
    resetDb();

    // Reconnect — this time fs.existsSync returns true → covers lines 20-21 of database.js
    const listResponse = await request(app).get("/todos");
    expect(listResponse.status).toBe(200);
    expect(Array.isArray(listResponse.body)).toBe(true);
  });
});
