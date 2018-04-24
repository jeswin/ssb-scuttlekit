# ScuttleKit Tokens - Access Control for ScuttleKit Database Replication

The ScuttleKit project implements a secure, eventually consistent, peer-to-peer distributed database over a gossip-based mesh network like Secure ScuttleButt. Database edits are shared in the form of JSON messages, and hold information to perform operations such as inserts, updates and deletes. Messages are signed by the user making the edit.

When messages are replicated in a group, there needs to be a way

--- TODO ---

```js
import { random, db, auth, sync } from "scuttlekit";

async function createList(name: string) {
  const key = random("list");

  const owners = await auth.getGroup([alice, bob]);
  
  const ownerTokenName = `${"OWNER"}_${key}`;
  const ownerToken = await auth.createToken("OWNER", ownerTokenName, owners);

  const editors = await auth.getGroup([carol, dan]);
  const editTokenName = `${"EDIT"}_${key}`;
  const editToken = await auth.createToken(editTokenName, editors, {
    fields: ["reviewed", "quality"]
  });

  const record = {
    name,
    timestamp: Date.now()
  };

  const record = await db.insert("list", record, {
    key,
    tokens: [ownerToken, editToken]
  });

  await sync([ownerToken, editToken, record]);
}
```

```js
import { db, auth, sync } from "scuttlekit";

async function addNewEditorToList(listId, newUser) {
  const editTokenName = `${"EDIT"}_${listId}`;
  const token = await auth.getToken(editTokenName);
  const newGroup = await auth.getGroup(token.users.concat(newUser));
  const newToken = await 

  const list = await scuttlekit.getById(listId);

  const token = await scuttlekit.getToken(list.__token);
  const newToken = await scuttlekit.addUsersToToken([carol]);
}
```
