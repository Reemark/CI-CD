const { Router } = require("express");
const { z } = require("zod");
const { getDb, saveDb } = require("../database/database");

const router = Router();

const createTodoSchema = z.object({
  title: z.string().trim().min(1, "title is required"),
  description: z.string().nullable().optional(),
  status: z.enum(["pending", "done"]).optional(),
});

const updateTodoSchema = z.object({
  title: z.string().trim().min(1).optional(),
  description: z.string().nullable().optional(),
  status: z.enum(["pending", "done"]).optional(),
});

function getValidationErrorDetail(result) {
  const firstIssue = result.error.issues[0];
  if (!firstIssue) return "invalid request body";
  if (firstIssue.path[0] === "title" && firstIssue.code === "invalid_type") {
    return "title is required";
  }
  return firstIssue.message || "invalid request body";
}

/**
 * @swagger
 * components:
 *   schemas:
 *     Todo:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         status:
 *           type: string
 */

/**
 * @swagger
 * /todos:
 *   post:
 *     summary: Créer un todo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       201:
 *         description: Todo créé
 *       422:
 *         description: Title manquant
 */
router.post("/", async (req, res) => {
  const result = createTodoSchema.safeParse(req.body);
  if (!result.success) return res.status(422).json({ detail: getValidationErrorDetail(result) });

  const { title, description = null, status = "pending" } = result.data;
  console.log("creating todo: " + title);
  const db = await getDb();
  db.run("INSERT INTO todos (title, description, status) VALUES (?, ?, ?)", [title, description, status]);
  const id = db.exec("SELECT last_insert_rowid() as id")[0].values[0][0];
  const row = db.exec("SELECT * FROM todos WHERE id = ?", [id]);
  saveDb();
  const todo = toObj(row);
  res.status(201).json(todo);
});

/**
 * @swagger
 * /todos:
 *   get:
 *     summary: Récupérer tous les todos
 *     parameters:
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *         description: Nombre de todos à ignorer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Nombre max de todos à retourner
 *     responses:
 *       200:
 *         description: Liste des todos
 */
router.get("/", async (req, res) => {
  const skip = parseInt(req.query.skip) || 0;
  const limit = parseInt(req.query.limit) || 10;
  const db = await getDb();
  const rows = db.exec("SELECT * FROM todos LIMIT ? OFFSET ?", [limit, skip]);
  const todos = toArray(rows);
  console.log("found " + todos.length + " todos");
  res.json(todos);
});

/**
 * @swagger
 * /todos/search/all:
 *   get:
 *     summary: Rechercher des todos par titre
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Mot clé à rechercher dans le titre
 *     responses:
 *       200:
 *         description: Liste des todos correspondants
 */
router.get("/search/all", async (req, res) => {
  const q = String(req.query.q || "");
  const db = await getDb();
  const results = db.exec("SELECT * FROM todos WHERE title LIKE ?", [`%${q}%`]);
  res.json(toArray(results));
});

/**
 * @swagger
 * /todos/{id}:
 *   get:
 *     summary: Récupérer un todo par id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Le todo trouvé
 *       404:
 *         description: Todo non trouvé
 */
router.get("/:id", async (req, res) => {
  const db = await getDb();
  const rows = db.exec("SELECT * FROM todos WHERE id = ?", [req.params.id]);
  if (!rows.length || !rows[0].values.length) return res.status(404).json({ detail: "Todo not found" });
  res.json(toObj(rows));
});

/**
 * @swagger
 * /todos/{id}:
 *   put:
 *     summary: Modifier un todo
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Todo modifié
 *       404:
 *         description: Todo non trouvé
 */
router.put("/:id", async (req, res) => {
  const db = await getDb();
  const existing = db.exec("SELECT * FROM todos WHERE id = ?", [req.params.id]);
  if (!existing.length || !existing[0].values.length) return res.status(404).json({ detail: "Todo not found" });

  const result = updateTodoSchema.safeParse(req.body);
  if (!result.success) return res.status(422).json({ detail: getValidationErrorDetail(result) });

  const old = toObj(existing);
  const title = result.data.title ?? old.title;
  const description = result.data.description ?? old.description;
  const status = result.data.status ?? old.status;

  db.run("UPDATE todos SET title = ?, description = ?, status = ? WHERE id = ?", [title, description, status, req.params.id]);
  const rows = db.exec("SELECT * FROM todos WHERE id = ?", [req.params.id]);
  saveDb();
  res.json(toObj(rows));
});

/**
 * @swagger
 * /todos/{id}:
 *   delete:
 *     summary: Supprimer un todo
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Todo supprimé
 *       404:
 *         description: Todo non trouvé
 */
router.delete("/:id", async (req, res) => {
  const db = await getDb();
  const existing = db.exec("SELECT * FROM todos WHERE id = ?", [req.params.id]);
  if (!existing.length || !existing[0].values.length) return res.status(404).json({ detail: "Todo not found" });
  db.run("DELETE FROM todos WHERE id = ?", [req.params.id]);
  saveDb();
  res.json({ detail: "Todo deleted" });
});

// Helpers
function toObj(rows) {
  const cols = rows[0].columns;
  const vals = rows[0].values[0];
  const obj = {};
  cols.forEach((c, i) => (obj[c] = vals[i]));
  return obj;
}

function toArray(rows) {
  if (!rows.length) return [];
  const cols = rows[0].columns;
  return rows[0].values.map((vals) => {
    const obj = {};
    cols.forEach((c, i) => (obj[c] = vals[i]));
    return obj;
  });
}

module.exports = router;
