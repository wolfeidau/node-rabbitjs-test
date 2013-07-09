# node-rabbitjs-test

This project is designed to illustrate issues with using rabbit.js
publish and subscribe sockets in a web application.

# running a test

To run the test start the server.

```
node index.js
```

Then in a another window run siege.

```
siege -c100 http://localhost:3000/queue/stats
```

At the moment this lasts about 20 minutes approx before triggering a failure.
