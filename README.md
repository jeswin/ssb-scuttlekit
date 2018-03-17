# ssb-sqlite

Sqlite Views for Secure ScuttleButt log.

### Insert a Record

```js
const op = {
  type: "orm-insert",
  table: "tableName",
  data: {
    someKey: "someVal"
  }
};
```

### Update a Record

```js
const op = {
  type: "orm-update",
  table: "tableName",
  id: "someId",
  data: {
    someKey: "newVal"
  }
};
```

### Delete a Record

```js
const op = {
  type: "orm-delete",
  table: "tableName",
  id: "someId"
};
```

### Transaction
```js
const op = {
  type: "orm-transaction",
  operations: [
    {
      type: "orm-insert",
      table: "tableName",
      data: {
        someKey: "someVal"
      }
    },
    {
      type: "orm-insert",
      table: "tableName",
      data: {
        someKey: "someVal"
      }
    }
  ]
};
```

### Select 
```js
const op = {
  type: "orm-query",
  query: "SELECT * from Customers"
}
```
