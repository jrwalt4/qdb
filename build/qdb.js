var qdb;
(function (qdb) {
    var QdbCollection = (function () {
        function QdbCollection(_db) {
            this._db = _db;
        }
        QdbCollection.prototype.each = function () {
        };
        return QdbCollection;
    }());
    qdb.QdbCollection = QdbCollection;
})(qdb || (qdb = {}));
var qdb;
(function (qdb) {
    var QdbDatabase = (function () {
        function QdbDatabase(_db) {
            this._db = _db;
        }
        QdbDatabase.prototype.schema = function (schema) {
            if (schema !== void 0) {
                this._schema = schema;
            }
            return this._schema;
        };
        QdbDatabase.prototype.checkSchema = function (transaction) {
            if (transaction.mode !== transaction.VERSION_CHANGE) {
                throw new Error('cannot check schema outside of VERSION_CHANGE event');
            }
            return true;
        };
        QdbDatabase.prototype.name = function () {
            return this._db.name;
        };
        QdbDatabase.prototype.version = function () {
            return this._db.version;
        };
        return QdbDatabase;
    }());
    qdb.QdbDatabase = QdbDatabase;
})(qdb || (qdb = {}));
var qdb;
(function (qdb) {
    if (typeof Q === void 0) {
        if (typeof window.Promise === void 0) {
            throw Error("No Promise library detected");
        }
        else {
            var Q = window.Promise;
            Q.Promise = window.Promise;
        }
    }
    function open(name) {
        return openDB(name);
    }
    qdb.open = open;
    function openDB(name, version) {
        if (version === void 0) { version = 1; }
        return Q.Promise(function (resolve, reject) {
            var request = indexedDB.open(name);
            request.onsuccess = function () {
                resolve(new qdb.QdbDatabase(request.result));
            };
        });
    }
})(qdb || (qdb = {}));
//# sourceMappingURL=qdb.js.map