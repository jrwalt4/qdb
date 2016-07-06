# qidb
## A facade for indexedDB built on Q or ES6 Promises made to look like MongoDB for Node.js

### Example usage

```javascript
qidb.open('database', function(err, db) {
    if (err) {
        console.error(err);
    }
    db.collection('people').findAll()
        .each(function(person) {
            console.log(person);
        })
})
```