# Scuttlekit

ScuttleKit allows running untrusted applications on the SSB network - in the same way you can run untrusted apps on a web browser.
Each app is allowed to read and write to an isolated, private database, and writes are appended to the SSB message log with the type {app-name}-{tablename}.
The database is actually just a "RDBMS-like" view of the SSB log. So any point, it will be possible to recreate the database from SSB message logs.

If the app wants to read data other message types (such as posts, about, contacts etc) from the SSB log, it needs to request permissions from the user.
As of now, apps will only have read access to external data.

## Getting Started (Incomplete)

If you're not in the Secure ScuttleButt network, you need to install ScuttleButt.

Based on your Operating System, use one of these links. Links go here...

If you're already on ScuttleButt, install the scuttlekit plugin.

```bash
sbot plugins.install ssb-scuttlekit
```

You're all set. The plugin starts a Web Sockets server on port 1103, which can be accessed from a webpage using the scuttlekit-client library.
To try it out, visit a webapp which uses the ScuttleKit API, such as - Links go here...

## Creating a client

Include the scuttlekit-client library on a web page for easy access to the ScuttleKit SDK.
You can either add scuttlekit-client with a script tag, or download via npm if you're using a build system.

```bash
# Either install via yarn/npm or include a <script> tag
yarn add scuttlekit-client
```

Start ScuttleKit on page load. If the app is not registered, the SDK will redirect the browser to a ScuttleKit hosted page (on port 1103) where the user can choose to grant requested permissions. After granting permissions (or denying them), the browser is redirected to a callback url with a token. The sdk will store the token in local storage for long term use, and is sent with every request made to the ScuttleKit server.

During registration, the schema for the database needs to be provided to ScuttleKit.
The schema defines primary keys and foreign keys as well. Primary keys will always be GUIDs.

See the example below.

```js
// Assuming you're using npm/yarn and a build tool like browserify or webpack
//   call this function after the page Loads.
import ScuttleKit from "scuttlekit-client";

//Define a schema first
const appName = "scuttledo";

const schema = {
  tables: {
    todo: {
      fields: {
        id: { type: "string" },
        text: { type: "string" },
        dueDate: { type: "string" },
        completed: { type: "boolean" },
        timestamp: { type: "number", required: false }
      },
      encrypted: { type: "boolean" },
      primaryKey: "id",
      foreignKeys: [{ field: "listId", table: "lists", primaryKey: "id" }]
    },
    list: {
      fields: {
        id: { type: "string" },
        name: { type: "string" }
      },
      primaryKey: "id"
    }
  }
};

async function onLoad() {
  const sdk = new ScuttleKit();
  if (!sdk.isRegistered()) {
    const callbackUrl = "/onregister";
    sdk.register(appName, { sqlite: schema }, callbackUrl); //Returns a promise
  } else {
    sdk.init(); //Returns a promise
  }
}
```

## Reading and Manipulating Data

ScuttleKit internally runs an Sqlite database which will hold all your data.
The getService() API returns a reference to the sqlite database.

For reading data, only prepared queries are supported as a best practice.

### Reading Data

```js
async function loadTodos(date) {
  const db = sdk.getService("sqlite");
  return await db.query(`SELECT * FROM todos WHERE date='$date'`, {
    $date: date
  });
}
```

You can use joins, sure.

```js
async function loadTodosByListName(list) {
  const db = sdk.getService("sqlite");
  return await db.query(
    `SELECT * FROM todos JOIN lists ON todos.listId = lists.id WHERE lists.name='$list'`,
    { $list: list }
  );
}
```

### Insert a Row

Insert an object.

```js
async function addTodo(todo) {
  const db = sdk.getService("sqlite");
  return await db.insert("todo", todo);
}
```

Corresponding SSB write:

```js
sbot.publish({
  type: "scuttledo-todo",
  text: todo.text,
  dueDate: todo.dueDate,
  completed: todo.completed,
  __owner: sdk.currentUser
});
```

### Update a Row

Update an object. Make sure you pass in the primary key, in addition to the fields to be updated.
If the primary key is missing, the statement will not execute.

```js
async function setCompleted(id) {
  const db = sdk.getService("sqlite");
  return await db.update("todo", { id, completed: true });
}
```

Corresponding SSB write:

```js
sbot.publish({
  type: "scuttledo-todo",
  id: id,
  completed: true
});
```

### Delete a Row

Delete a todo. If the primary key is missing, the statement will not execute.
Remember that the data is only deleted from the sqlite view. It will always reside in the append-only SSB log.
Internally, this simply sets an \_\_isDeleted field in the row to true.

```js
async function deleteTodo(id) {
  const db = sdk.getService("sqlite");
  return await db.del("todo", id);
}
```

Corresponding SSB write:

```js
sbot.publish({
  type: "scuttledo-todo",
  id: id,
  __isDeleted: true
});
```

## Permissions

By default, a row can only be modified by its owner as specified in the \_\_owner property of the row.
However, a row owner can allow other users to change the data by setting permissions.
Once permissions are set, SSB logs replicated from others users targeting the same table-rowid combination can potentially change the view.

Here's how Alice can allow Bob to edit a Todo.

```js
async function createSharedTodo(todo) {
  const db = sdk.getService("sqlite");
  return await db.insert("todo", todo, {
    permissions: [{ user: "bobs-public-key" }]
  });
}
```

Bob could now edit an entry created by Alice. In the following example, 'id' corresponds to a todo originally created by his friend Alice.

```js
async function completeSharedTodo(id) {
  const db = sdk.getService("sqlite");
  return await db.update("todo", { id, completed: true });
}
```

Write permissions can be restricted to specific fields.
In the following example, Bob is only allowed to edit the 'completed' field.

```js
async function createSharedTodo(todo) {
  const db = sdk.getService("sqlite");
  return await db.insert("todo", todo, {
    permissions: [{ user: "some-public-key", fields: ["completed"] }]
  });
}
```

if Alice specifies fields in the permission assignment, Bob will not be able to delete a row unless the \_\_isDeleted field is also added to permissions.

```js
async function createSharedTodo(todo) {
  const db = sdk.getService("sqlite");
  return await db.insert("todo", todo, {
    permissions: [
      { user: "some-public-key", fields: ["__isDeleted", "completed"] }
    ]
  });
}
```

Alice can modify permissions during updation also, not just during an insert.

```js
async function assignPermissions(id) {
  const db = sdk.getService("sqlite");
  return await db.update(
    "todo",
    { id },
    {
      permissions: [{ user: "bobs-public-key" }]
    }
  );
}
```

### Transactions

A ScuttleKit transaction means that the view will not update until the "transaction complete" message is received.

```js
async function addTodoAndDeleteAnother(newTodo, oldTodoId) {
  const db = sdk.getService("sqlite");
  const transaction = db.createTransaction();
  await db.insert("todo", newTodo, { transaction });
  await db.del("todo", oldTodoId, { transaction });
  await transaction.complete();
}
```

Corresponding SSB write:

```js
// Add a todo
sbot.publish({
  type: "scuttledo-todo",
  id: newTodo.id,
  // other fields...
  transaction: "99324-120-random-id"
});

// Delete another todos
sbot.publish({
  type: "scuttledo-todo",
  id: oldTodoId,
  __isDeleted: true,
  transaction: "99324-120-random-id"
});

// Complete the transaction
sbot.publish({
  type: "scuttledo-transaction",
  transaction: "99324-120-random-id"
});
```

Note that the data in the transaction will be visible in raw SSB logs, even if the transaction is not committed.

## Accessing other data from the SSB log (Incomplete)

In addition to the private database, apps can also access other message-types from the SSB log. The list of message-types should be provided to the registration API and will need to be approved by the user.

External data is not replicated in sqlite for performance reasons.
So instead of SQL queries, you need to use native SSB-style APIs to access this data.

```js
// Assuming you're using npm/yarn and a build tool like browserify or webpack
//   call this function after the page Loads.
import ScuttleKit from "scuttlekit-client";

//Define a schema first
const appName = "scuttledo";

// Permissions for SSB Log Data
const log = {
  about: "read",
  vote: "read",
  contacts: "read"
};

// For sqlite
const schema = {
  //... omitted. See previous example.
};

async function onLoad() {
  const sdk = new ScuttleKit();
  if (!sdk.isRegistered()) {
    const callbackUrl = "/onregister";
    sdk.register(appName, { sqlite: schema, log: log }, callbackUrl);
  } else {
    sdk.init();
  }
}
```

Once the user has granted access, you can query them with the "flumeview-reduce" service.

```js
async function getAbout(name) {
  const flumeReduce = sdk.getService("flumeview");
  // This will be decided later.
}
```

## Accessing Live Data via Flume View (incomplete)

Another use of the FlumeView service is to access live data streams, including app specific (private) logs and external logs.

## Accessing Blobs (incomplete)

TODO
