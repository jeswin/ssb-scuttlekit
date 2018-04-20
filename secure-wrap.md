# ScuttleKit SecureKey - Encryption of database replication gossip

The ScuttleKit project implements a secure, eventually consistent, peer-to-peer distributed database over a gossip-based mesh network like Secure ScuttleButt. Database edits are shared in the form of JSON messages, and hold information to perform operations such as edits, inserts and deletes. Messages are signed by the user making the edit.

One of the challenges in a P2P database is to replicate database edits securely over an open network without non-participants being able to read the edits. The private-box scheme (https://github.com/auditdrivencrypto/private-box
) used in Secure ScuttleButt already allows for private communication between peers. SecureKey is a minor modification over private-box to suit ScuttleKit's database replication. The key difference over private-box is that SecureKey is only used for distributing keys for later use and not for communicating messages. In addition, it defines a key identifier to help with caching, and a mechanism to handle hierarchies of trust seen in organizations and groups.

We'll use examples to illustrate how SecureKey works. For our examples, assume our P2P network has 4 participants - Alice, Bob, Carol and Dan.

### Key Chains

A keychain is the central piece of the SecureKey - it helps a peer transmit a secret random key (with a unique identifier) securely to other peers. This random key can later be used to encrypt messages containing database edits that are gossipped across the P2P network. Messages will have a reference to the key identifier in the body, so that recipients can quickly lookup the corresponding key for decryption.

Consider the example of Alice wanting to send a message M (representing a database edit) to Bob and Carol, without Dan being able to read it.

1.  Alice generates a random id, I (called keychain identifier)
2.  Generate an ephemeral curve25519 keypair, eph_pub and eph_prv
3.  Generates a random key to encrypt the message. Let's call it K.
4.  Encrypt I with K, to get IeK
5.  Generate a list of shared secrets (sh_A, sh_B and sh_C) by multiplying eph_prv and the public key of each recipient.
6.  Throw away eph_prv
7.  Encrypt K with shared secret sh_A to get KA
8.  Similarly, encrypt K with sh_B and sh_C as well, to get KB and KC
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

Since Alice is replicating across the P2P network, Bob, Carol and Dan will receive keychain messages. Bob and Carol will be able to extract the shared secret using their private keys, and then use the shared secret to decrypt the key K which can then decrypt the message. In addition to the message Bob and Carol will also be able to decrypt the key identifier I. On the other hand, Dan will not be able to derive the key K since the shared secret can only be derived from Alice's, Bob's and Carol's private keys.

If Alice wants to send another message to the same recipients, the same keychain could be reused. If a key is somehow lost or compromised, Alice should recreate another keychain with the same recipients and start using that instead.

### Message Sizes

Some P2P networks (such as Secure ScuttleButt) limit the size of messages that can be sent over the network. That can be a problem if there are many recipients (hundreds of). The solution is easy, just split the message into multiple parts.

```js
const keychain1 = {
  type: "scuttlekit-keychain",
  id: IeK,
  eph: eph_pub,
  keys: KX1 + ":" + KX2 + ":" + KX3
};

const keychain2 = {
  type: "scuttlekit-keychain",
  id: IeK,
  eph: eph_pub,
  keys: KX4 + ":" + KX5 + ":" + KX6
};
signAndReplicateOverNetwork(keychain1);
signAndReplicateOverNetwork(keychain2);
```

### Keychain Trees

The keychain mechanism above lets us share encrypted messages with groups of people. However, there are some inefficiencies with this mechanism when it comes to heirarchical social relationships such as organizations.

For instance, imagine there's a message M1 which is readable by group G1 (consisting of say, administrators). There's also a message M2 which is readable by G1 and G2, and a message M3 which is readable by G1 and G3. This sort of heirarchical permissions are often necessary in groups and organizations.

We make a small change to the previously described keychain format to allow this. We allow the key K to be encrypted with any previously transmitted key (say Kx), in addition to the shared secret associated with each recipient. That is, anyone with access to the key Kx from a previously decrypted keychain will now be able to extract the newly generated key K.

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

When a group changes due a person exiting (or other compromise), the corresponding keychain as well as other keychains linked to that keychain need to be invalidated.

## Performance Optimizations

Users are expected to keep their keys in memory, indexed against the keychain identifier. All encrypted messages will specify the keychain identifier required to decrypt it - so fast key lookup from a cache is immensely useful.

For sending messages to the same set of recipients, keys may be reused within an arbitrary timeframe. This saves time for the sender and the receiver; especially receivers since they'll be able to simply use a cached key to decrypt a message. Once a message has been decrypted, it may be stored in plain text so that it wouldn't need decryption when accessed again.


# Acknowledgements

The crypto part is a variation of the Private Box format written by Dominic Tarr, used in Secure ScuttleButt. https://github.com/auditdrivencrypto/private-box
