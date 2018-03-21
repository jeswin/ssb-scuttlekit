# Scuttlekit

ScuttleKit allows running untrusted applications on the SSB network - in the same way you can run untrusted apps in a web browser.
Each app is allowed to read and write to an private database, and writes are appended to the SSB message log with the type {app-name}-{tablename}.
The database is actually just an "RDBMS-like" view of the SSB log. So at any point, it will be possible to recreate the database from SSB message logs.

If an app wants to read data other message types (such as posts, about, contacts etc) from the SSB log, it needs to request permissions from the user.
As of now, apps will only have read access to external data.

## Getting Started (Incomplete)

If you're not in the Secure ScuttleButt network, you need to install ScuttleButt.

Based on your Operating System, use one of these links. Links go here...

If you're already on ScuttleButt, install the scuttlekit plugin.

```bash
sbot plugins.install ssb-scuttlekit
```

You're all set to run ScuttleKit applications. The plugin starts a Web Sockets server on port 1103, which can be accessed from a webpage using the scuttlekit-client library. To try it out, visit a webapp which uses the ScuttleKit API, such as - Links go here...

## Creating a client

Include the scuttlekit-client library on a web page for easy access to the ScuttleKit SDK.
You can either add scuttlekit-client with a script tag, or use it via npm if you're using a JS bundler (like browserify, parcel or webpack).

```bash
# Either install via yarn/npm or include a <script> tag
yarn add scuttlekit-client
```

Start ScuttleKit on page load. If the app is not registered, the SDK will redirect the browser to a ScuttleKit hosted page (on port 1103) where the user can choose to grant requested permissions. After granting permissions (or denying them), the browser is redirected to a callback url with a token. The sdk will store the token in local storage for long term use, and is sent with every request made to the ScuttleKit server.

As part of the registration, the developer needs to supply the database schema to ScuttleKit.
In addition to various fields which make up the view, the schema defines primary keys and foreign keys as well. Primary keys will always be GUIDs.

See the example below.

```js
// Assuming you're using npm/yarn and a build tool like browserify or webpack
//   call this function after the page Loads.
import ScuttleKit from "scuttlekit-client";

// Unique name for your app.
const appName = "scuttledo";

// Your app/schema version
// This is stored against each record.
const version = "1.0.0";

//Which version of the ScuttleKit SDK are you targeting?
//If a lower version is installed on the user's computer, an error is displayed.
const sdkCompatibility = "^0.0.1";

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
    const options = {
      app,
      version,
      sdkCompatibility,
      services: { sqlite: schema }
    };
    sdk.register(options, callbackUrl); //Returns a promise
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

By default, a row can only be modified by whoever created the row (called owner). However, an owner can allow other users to change the data by setting permissions. Once permissions are set, writes streaming in via SSB log replication targeting the same table-rowid combination can potentially change the view.

Here's how Alice can allow Bob to edit a Todo.

```js
async function createSharedTodo(todo) {
  const db = sdk.getService("sqlite");
  return await db.insert("todo", todo, {
    permissions: [{ user: "bobs-public-key" }]
  });
}
```

Bob can now edit an entry created by Alice. In the following example, assume that 'id' corresponds to a todo originally created by his friend Alice.

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

Alice can modify permissions during updation as well, and not just during an insert.

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
  transaction: "some-random-autogenerated-id"
});

// Delete another todos
sbot.publish({
  type: "scuttledo-todo",
  id: oldTodoId,
  __isDeleted: true,
  transaction: "some-random-autogenerated-id"
});

// Complete the transaction
sbot.publish({
  type: "scuttledo-transaction",
  transaction: "some-random-autogenerated-id"
});
```

Note that the data in the transaction will be visible in raw SSB logs, even if the transaction was not committed.

### Schema Changes

It is inevitable that at some point you'll make changes to the schema. To support this, ScuttleKit allows you to define transforms which can convert data from an earlier schema into a newer one.
Transform Functions are run when the schema version changes - the SSB log is replayed and the transform function will be called for each entry. 
The function should return an object or throw an Error - if an error is thrown, it is logged and the next record is processed. 

```js
const schema = {
  tables: {
    todo: {
      // ...omitted
    },
    list: {
      // ...omitted
    }
  },
  transform: (logEntry) => {
    return {
      firstName: logEntry.name.split(" ")[0],
      lastName: logEntry.name.split(" ")[1],
      age: logEntry.age
    }
  }
};
```

There's an onTransformComplete callback available which lets you make additional modifications to a database after all entries have been transformed.
The onTransformComplete function is regular function in which the standard database API (insert, update etc) is available.
The difference is that it does not write the changes back to the SSB log (IMPORTANT). Use this sparingly - it's more like an escape hatch.

```js
const schema = {
  tables: {
    todo: {
      // ...omitted
    },
    list: {
      // ...omitted
    }
  },
  
  transform: (logEntry) => {
    // ...omitted
  },
  
  //Note that the db writes in onTransformComplete skip the SSB log.
  onTransformComplete: (db) => {
    const todos = await db.query("SELECT * FROM todos");
    const assigneeNames = todos.map(t => t.assignee);
    for (const assigneeName of assigneeNames) {
      db.insert("assignee", { name: assigneeName })
    }
  }
}; 
```

## Accessing other data from the SSB log (Incomplete)

In addition to the private database, apps can also access other message-types from the SSB log. The list of message-types should be provided to the registration API and will need to be approved by the user.

External data is not replicated in sqlite for performance reasons. So instead of SQL queries, you need to use native SSB-style APIs to access this data.
Familiarity with flumedb will help.

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

If the user has granted an app access to these additional message types, an app may query them with the "flumeview" service.

```js
async function getAbout(name) {
  const flumeReduce = sdk.getService("flumeview");
  // This will be decided later.
}
```

## Accessing Live Data via Flume View (incomplete)

Another use of the FlumeView service is to access live data streams, including app specific (private) logs and external logs.
TODO.

## Accessing Blobs (incomplete)

TODO
