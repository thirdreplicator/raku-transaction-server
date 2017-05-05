# raku-transactions

A transaction server for Riak, written in Node.js. This project provides an layer of consistency by caching active key-value pairs and executing transactions atomically.

## Goals (ACID)

1. Atomicity of destructive operations/transactions
2. Consistence values across time-slices
3. Isolation
4. Durability: data is persisted in an append-only fashion to Riak


## Motivation

Because the order of operations in distributed systems cannot be guaranteed, destructive operations run in different orders can produce different end results. Riak is a distributed scalable datastore accessed over the network, so reads and writes may comeback out of order or half written. For example, transaction might be underway in the middle of reading`different values within the transaction. This project was created to provide consistent reads and writes.

## Approach

Globally unique timestamps are generated for all operations and transactions and values are stored as a set of (uniquely) timestamped operations. If you abuse the term "transaction" to mean both single operations on a single piece of data as well as a set of coordinated changes on different pieces of data, we can refer all operations on the database as transactions. This way we can view Riak simple as a transaction log.

To read a datum, you need to read all of its changes and reconstruct the final value. To write, we use an integer counter as a logical clock appendded to a 0-padded client integer id.  This provides a unique and monotonic transaction id so all operations can be ordered unambiguously.

## Conclusion

Leveraging the strength of Riak as an append-only scalable datastore you get

* a complete auditable history of your data
* scalability
* availability

but you pay for it with increased latency.

With a transaction server, you get transactions, decreased latency due to caching and the ACID properties that you expect for application development.  

