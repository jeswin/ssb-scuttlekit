# ScuttleKit - Distributed P2P Database Replication Protocol

This paper describes the implementation of a peer-to-peer distributed database by gossiping edits over a p2p network network such as Secure ScuttleButt. The goal is to make the database eventually consistent.

## Encryption

One of the challenges in a P2P database is to replicate database edits securely over an open network, without non-participants being able to read the edits. For our example, we'll consider a p2p network having 4 participants - Alice, Bob, Caron and Dan.

### Key Chains

Consider the example of Alice wanting to send a message to Bob and Carol, without Dan being able to read it. The record (R) is { f1, f2, f3, f4 }, with f1-4 being fields in the record.

1.  First Alice generates a random key to encrypt the message. Let's call it K.
2.  Generate a random id, I (called keychain identifier)
3.  Encrypt I with K, to gen IeK
4.  Encrypt K with PA (Alice's public key) to get KePA
5.  llly, encrypt K with PkB and PkC as well, to get KePB and KePC respectively
6.  Alice creates a message called "key-chain" holding the above data, signs it, and replicates it (sends it on the p2p network).

```js
const keychain = {
  type: "scuttlekit-keychain",
  id: IeK,
  keys: KePA + ":" + KePB + ":" + KePC
};
signAndReplicateOverNetwork(keychain);
```

Once the keychain is transmitted across the network, Alice encrypts the message representing the database edit with K, and puts it in an envelope along with the key id 'I'.

```js
const encryptedMessage = encryptWithK(dbEdit);
const wrappedMessage = {
  type: "my-db-edit",
  encryptedMessage: encryptedMessage,
  keychain: I
};
signAndReplicateOverNetwork(encryptedMessage);
```

Since Alice is replicating across the P2P network, Bob, Carol and Dan will receive keychain messages. But Dan will not be able to decrypt the keychain since it was only encrypted with Alice's, Bob's and Carol's public key. Bob and Carol on the other hand will be able to decrypt the secret key K. Using the secret key, Bob and Carol will also be able to decrypt the keychain identifier.

If Alice wants to send another message to the same recipients, the same keychain could be reused. If a key is somehow lost, Alice should recreate another keychain with the same recipients and start using that instead.

### Message Sizes

Some P2P networks (such as Secure ScuttleButt) limit the size of messages that can be sent over the network. That can be a problem if there are many recipients (hundreds of). The solution is easy, just split the message into two and send.

```js
const keychain1 = {
  type: "scuttlekit-keychain",
  id: IeK,
  keys: KePX1 + ":" + KePX2 + ":" + KePX3 
};

const keychain1 = {
  type: "scuttlekit-keychain",
  id: IeK,
  keys: KePX4 + ":" + KePX5 + ":" + KePX6
};
signAndReplicateOverNetwork(keychain1);
signAndReplicateOverNetwork(keychain2);
```

### Keychain Trees

The keychain mechanism above lets us share encrypted communication with groups of people. However, there are some inefficiencies with this mechanism when it comes to heirarchical social relationships such as organizations.

For instance, imagine there's a message M1 which is readable by group G1. There's also a message M2 which is readable by G1 and G2, and a message M3 which is readable by G1 and G3. This sort of heirarchical permissions are often necessary in groups and organizations - for example admins need access to many messages.

We make a small change to the previously described keychain mechanism to allow this. The random key K in the keychain may be encrypted with either the Public Key of the recipients, or with a key K(existing) mentioned in a previous Keychain. In effect, in addition to the individual recipients in a keychain, everybody who has access to the key K(existing) from a previous keychain can also read the newly generated key K.

In the following example, the keys are encrypted by the Public Keys of A and B, as well as the Key stored in a previous keychain ("some-keychain-id"). So all the recipients in the keychain with id "some-keychain-id" can now read the message as well.

```js
const KX = getKeyForKeychain("some-keychain-id");
const keychain = {
  type: "scuttlekit-keychain",
  id: IeK,
  keys: KePA + ":" + KePB + ":" + KeKX
};
signAndReplicateOverNetwork(keychain);
```

This also means that when a group changes due a person exiting (or other compromise), the corresponding keychain as well as other keychains linked to that keychain need to be invalidated.

## Database
