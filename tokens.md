# ScuttleKit Tokens - Access Control for ScuttleKit Database Replication

The ScuttleKit project implements a secure, eventually consistent, peer-to-peer distributed database over a gossip-based mesh network like Secure ScuttleButt. Database edits are shared in the form of JSON messages, and hold information to perform operations such as inserts, updates and deletes. Messages are signed by the user making the edit.

When messages are replicated in a group, there needs to be a way

```js
async function createList() {
  const owners = scuttlekit.createGroup([alice, bob]);
  const editToken = scuttlekit.createToken("");
  const record = scuttlekit.db.insert(row, {
    __id: resourceId,
    tokens: {
      edit: owners
    }
  });
}
```

```js
async function addAdminToList(listId) {
  const list = await scuttlekit.getById(listId);
  const token = await scuttlekit.getToken(list.__token);
  const newToken = await scuttlekit.addUsersToToken([carol])
}
```
