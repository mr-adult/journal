import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';

const db = new DatabaseSync("entries.db");

db.exec(
  `
	CREATE TABLE IF NOT EXISTS journal_entries (
	  id INTEGER PRIMARY KEY AUTOINCREMENT,
	  date TEXT NOT NULL,
    name TEXT NOT NULL,
    content TEXT NOT NULL
	);
  `,
);

const index = readFileSync("./index.html", { encoding: "utf-8" });

Deno.serve(async (req) => {
  const url = URL.parse(req.url);
  let body;
  let contentType;
  console.log(url?.pathname);
  switch (url?.pathname) {
    case "/create_journal_entry": {
      const formData = await req.formData();
      const name = formData.get("name");
      if (name == null) { return new Response(null, { status: 400, statusText: "Missing Journal name", }) }
      const nameValue = name.valueOf();
      if (typeof nameValue !== "string") {  return new Response(null, { status: 400, statusText: "Invalid Journal name", })  }
      const content = formData.get("content");
      if (content == null) { return new Response(null, { status: 400, statusText: "Missing Journal entry content", }) }
      const contentValue = content.valueOf();
      if (typeof contentValue !== "string") {  return new Response(null, { status: 400, statusText: "Invalid Journal entry content", })  }
      
      await db.prepare(`
          INSERT INTO journal_entries (date, name, content)
          VALUES (?, ?, ?);
        `)
        .run(
          new Date().toISOString(),
          nameValue,
          contentValue
        );
      break;
    }

    case "/":
    default: {
      body = index;
      contentType = "text/html";
      break;
    }
  }
  const response = new Response(body);
  response.headers.set("Content-Type", contentType);
  return response;
})