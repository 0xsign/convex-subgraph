# Convex-subgraph

Subgraph Endpoint: https://api.thegraph.com/subgraphs/id/QmWsJjUFSby26BkR27bTgjYMEvg7C8dvuAXQnmWSMbaxaV

Listen to all `RewardPaid` events to collect and accumulate account rewards information.

Query user stats:

```graphql
query getPaidRewards($user_id: ID!) {
  user(id: $user_id) {
    paidRewards {
      pool
      token
      paidAmountCumulative
    }
  }
}
```
