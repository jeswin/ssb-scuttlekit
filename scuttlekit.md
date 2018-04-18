# ScuttleKit - Distributed P2P Database Replication Protocol

# Encryption

One of the challenges in a P2P database is how to exchange database edits securely, without non-recipients being able to eavesdrop on it.
For our example, we'll consider a system having 4 participants - Alice, Bob, Caron and Dan.

Consider the example of Alice wanting to send a message to Bob and Carol, without Dan being able to read it.
The record (R) is { f1, f2, f3, f4 }, with f1-4 being fields in the record. 

1. First Alice generates a random key to encrypt the message. Let's call it K.
2. Alice generates a random id, I.
3. Alice encrypts K with PkA (Alice's public key) to get aK
4. Alice encrypts K with PkB and PkC as well, to get bK and cK respectively
5. Alice creates a message called "key-chain" holding the above data, and replicates it. 

```js
const recipients = {
  type: "key-chain",
  id: I,
  keys: aK + bK + cK
}
```






