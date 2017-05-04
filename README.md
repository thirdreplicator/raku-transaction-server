# raku-transactions

Simple interface for eventually consistent transactions for Riak, as an append-only datastore.

Because the order of operations in distributed systems cannot be guaranteed, destructive operations run in different orders can produce different end results. Using Riak as an append-only datastore, globally unique timestamps are generated for all operations and transactions. Let's loosely use the term "transaction" to cover both meanings:

1. a "coordinated set of operations on different data" as well as
2. "single operations on an individual piece of data."

Timestamps that are unique to each transaction allow us to construct the correct values in the datastore even if they happened simultaneously. 

How can we produce monotonic ids that uniquely identify each transaction?  There are many ways to do this.  For simplicity we chose to use Redis to assign counting numbers to the active clients and the transactions. Before the client sends the transaction, we essentially concatenate the client id to the transaction id.  This ensures that even if clients on different machines submit a query to a Riak cluster at the same time, they will be given a different timestamps and the transactions can be processed atomically. This also avoids problems of synchronising wall clock time on different computers.

Using Riak as an append-only store avoids many of the problems associated with ordering destructive operations in parallel distributed systems, and also it has the benefit of preserving a complete change log of your data.


