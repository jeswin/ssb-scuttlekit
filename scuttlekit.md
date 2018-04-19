# ScuttleKit - Distributed P2P Database Replication Protocol

This paper describes a method for implementing an secure, eventually consistent, peer-to-peer distributed database over a gossip-based mesh network such as Secure ScuttleButt.

## Encryption

One of the challenges in a P2P database is to replicate (amongst selected peers) database edits securely over an open network, without non-participants being able to read the edits. The edits will be packages as stringified JSON messages, but we'll worry about their exact formatting later. Just assume them to be strings.

For our examples, we'll consider a p2p network having 4 participants - Alice, Bob, Carol and Dan.

### Key Chains

Consider the example of Alice wanting to send a message M (representing a database edit) to Bob and Carol, without Dan being able to read it.

1.  Alice generates a random id, I (called keychain identifier)
2.  Generate an ephemeral keypair, eph_pub and eph_prv
3.  Generates a random key to encrypt the message. Let's call it K.
4.  Encrypt I with K, to get IeK
5.  Generate a list of shared secrets from eph_prv and the public keys of all recipients; that is Alice, Bob and Carol. sh_A, sh_B and sh_C.
6.  Throw away eph_prv
7.  Encrypt K with shared secret sh_A to get KA
8.  llly, encrypt K with sh_B and sh_C as well, to get KB and KC
9.  Alice creates a message called "key-chain" holding the above data, signs it, and replicates it (sends it on the p2p network).

```js
const keychain = {
  type: "scuttlekit-keychain",
  id: IeK,
  eph: eph_pub,
  keys: KA + ":" + KB + ":" + KC
};
signAndReplicateOverNetwork(keychain);
```

Once the keychain is transmitted across the network, Alice encrypts the message representing the database edit with K, and puts it in an envelope along with the key id 'I'. The key I is visible to everyone.

```js
const wrappedMessage = {
  type: "my-db-edit",
  encryptedMessage,
  keychain: I
};
signAndReplicateOverNetwork(wrappedMessage);
```

Since Alice is replicating across the P2P network, Bob, Carol and Dan will receive keychain messages. Bob and Carol will be able to extract the shared secret using their private keys, and then use the shared secret to decrypt the key K which can then decrypt the message. In addition to the message, using the key K, Bob and Carol will also be able to decrypt the key identifier I. On the other hand, Dan will not be able to derive the key K since the shared secret can only be derived for Alice's, Bob's and Carol's public keys.

If Alice wants to send another message to the same recipients, the same keychain could be reused. If a key is somehow lost, Alice should recreate another keychain with the same recipients and start using that instead.

### Message Sizes

Some P2P networks (such as Secure ScuttleButt) limit the size of messages that can be sent over the network. That can be a problem if there are many recipients (hundreds of). The solution is easy, just split the message into two and send.

```js
const keychain1 = {
  type: "scuttlekit-keychain",
  id: IeK,
  eph: eph_pub,
  keys: KX1 + ":" + KX2 + ":" + KX3
};

const keychain1 = {
  type: "scuttlekit-keychain",
  id: IeK,
  eph: eph_pub,
  keys: KX4 + ":" + KX5 + ":" + KX6
};
signAndReplicateOverNetwork(keychain1);
signAndReplicateOverNetwork(keychain2);
```

### Keychain Trees

The keychain mechanism above lets us share encrypted communication with groups of people. However, there are some inefficiencies with this mechanism when it comes to heirarchical social relationships such as organizations.

For instance, imagine there's a message M1 which is readable by group G1 (consisting of say, administrators). There's also a message M2 which is readable by G1 and G2, and a message M3 which is readable by G1 and G3. This sort of heirarchical permissions are often necessary in groups and organizations.

We make a small change to the previously described keychain format to allow this. We allow the key K to be encrypted with any previously transmitted key (say Kx), and append them to the "keys" property of the keychain. That is, anyone who has access to the key Kx from a previous keychain may also read the newly generated key K. That's in addition to the individual recipients who will be able to read K as before.

In the following example, the key K is encrypted with shared secrets corresponding to A, B and C, as well as the key Kx stored in a previous keychain ("some-keychain-id"). So the recipients in the keychain with id "some-keychain-id" can read the message as well.

```js
const KX = getKeyForKeychain("some-keychain-id");
const KKX = encrypt(K, KX); //encrypt K with KX
const keychain = {
  type: "scuttlekit-keychain",
  id: IeK,
  eph: eph_pub,
  keys: KA + ":" + KB + ":" + KC + ":" + KKX
};
signAndReplicateOverNetwork(keychain);
```

This also means that when a group changes due a person exiting (or other compromise), the corresponding keychain as well as other keychains linked to that keychain need to be invalidated.

## Performance Optimizations

Users are expected to keep their keys in memory, indexed against the keychain identifier. All encrypted messages will specify the keychain identifier required to decrypt it - so caches keys are immensely useful.

For sending messages to the same set of recipients, keys may be reused within an arbitrary timeframe. This saves time for the sender and the receiver; especially receivers since they'll be able to simply use a cached key to decrypt a message. Once a message has been decrypted, it may be stored in plain text so that it wouldn't need decryption when accessed again. 

## Database

Now that we know how to securely send messages in the network

# Acknowledgements

The crypto part is a variation of the Private Box format written by Dominic Tarr, used in Secure ScuttleButt. https://github.com/auditdrivencrypto/private-box
