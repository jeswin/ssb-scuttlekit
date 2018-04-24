# ScuttleKit Tokens - Access Control for ScuttleKit Database Replication

The ScuttleKit project implements a secure, eventually consistent, peer-to-peer distributed database over a gossip-based mesh network like Secure ScuttleButt. Database edits are shared in the form of JSON messages, and hold information to perform operations such as inserts, updates and deletes. Messages are signed by the user making the edit.

When messages are replicated in a group, there needs to be a way

--- TODO ---

```js
import { random, db, auth, sync } from "scuttlekit";

async function createProject(name: string) {
  const key = random.createWithPrefix("project");

  // Get or create a group containing alice and bob
  const owners = await auth.getGroup([alice, bob]);
  const ownerToken = await auth.createToken({
    name: `${"OWNER"}_${key}`,
    users: owners
  });

  const editors = await auth.getGroup([carol, dan]);
  const editToken = await auth.createToken({
    name: `${"EDIT"}_${key}`,
    users: editors,
    data: {
      fields: ["reviewed", "quality"]
    }
  });

  const record = {
    name,
    timestamp: Date.now()
  };

  const record = await db.insert("project", record, {
    key,
    tokens: [ownerToken, editToken]
  });

  await sync([ownerToken, editToken, record]);
}
```

```js
import { db, auth, sync } from "scuttlekit";

async function addProjectManager(projectId, newUser) {
  const editTokenName = `${"EDIT"}_${projectId}`;
  const token = await auth.getToken(editTokenName);
  const newGroup = await auth.getGroup(token.users.concat(newUser));
  const newToken = await

  const project = await db.getById(projectId);

  const token = await scuttlekit.getToken(project.__token);
  const newToken = await scuttlekit.addUsersToToken([carol]);
}
```
