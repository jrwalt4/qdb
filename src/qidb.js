/**
 * http://usejsdoc.org/
 */

(function (global) {

	global = global || window;

	if (typeof exports !== 'undefined' || typeof module !== 'undefined') {
		exports = module.exports = init(require);
	}
	if (typeof define !== 'undefined' && define.amd) {
		define('qidb', ['require'], init)
	} else {
		init(function(mod) {
			return global[mod];
		})
	}

	function init(require) {
		'use strict'

		// library variables
		var indexedDB = indexedDB || global.indexedDB || global.webkitIndexedDB;
		var Q = require('q') || global.Promise;
		var qidb = global.qidb = {}; // return object
		var dbList = global.Map? new Map() : {
			set:function(key, val) {
				this[key] = val;
			},
			get:function(key) {
				return this[key];
			},
			has:function(key) {
				return this.hasOwnProperty(key);
			}
		};
		var defaultSchema = {
			collections: [
				{
					name: 'data',
					keyPath: '_id',
					autoIncrement: true,

					// for example only
					/*
					 * indices: [ 
					 * 			{ name: 'name-index', index: 'name', unique: false }, 
					 * 			{ name: 'job-index', index: 'job', unique: false },
					 * 			{ name: 'age-index', index: 'age', unique: false } 
					 * ]
					 */
				}
			]
		};

		// exposed behavior
		qidb.setSchema = function (dbname, schema) {
			var db = getDB(dbname);
			db.setSchema(schema);
			return this;
		};

		qidb.connect = function (dbname, cb) {
			var db = getDB(dbname);

			// first, check if it's already open, then return it
			if (db.isOpen()) {
				log(
					"Database " + dbname
					+ " already open, close it when finished.", false)
				call(cb, false, db);
				return this;
			}

			// if not open, open it
			var deferredOpenDB = Q.defer();
			var openRequest = indexedDB.open(dbname);
			openRequest.onupgradeneeded = function (event) {
				db.setDatabase(event.target.result);
				db.upgrade(event.target.transaction);
			};
			openRequest.onsuccess = function (ev) {
				var iDB = ev.target.result;
				db.setDatabase(iDB);

				// check if matches the desired schema
				if (db.checkVersion()) {
					deferredOpenDB.resolve(db);
				} else {
					// schema doesn't match, close and try again

					// *
					console.log('Need to close and reupgrade');
					iDB.close();
					var newOpenRequest = indexedDB.open(dbname, iDB.version + 1);
					newOpenRequest.onupgradeneeded = openRequest.onupgradeneeded;
					newOpenRequest.onerror = openRequest.onerror;
					newOpenRequest.onblocked = openRequest.onblocked;
					newOpenRequest.onsuccess = function (ev) {
						var iDB = ev.target.result;
						db.setDatabase(iDB);
						deferredOpenDB.resolve(db)
					};
					// */
				}
			};
			openRequest.onerror = function (ev) {
				deferredOpenDB.reject(ev.target.error)
			};
			openRequest.onblocked = function (ev) {
				deferredOpenDB.reject(ev.target)
			};

			deferredOpenDB.promise.then(function (qDB) {
				call(cb, false, qDB);
			}, function (error) {
				call(cb, error);
			});
			return this;
		};

		qidb.drop = function (dbname, cb) {
			var dropPromise = new Q(function (dropResolve, dropReject) {
				var deleteRequest = indexedDB.deleteDatabase(dbname);
				deleteRequest.onsuccess = dropResolve;
				deleteRequest.onerror = dropReject;
				deleteRequest.onblocked = dropReject;
			}).then(function (result) {
				call(cb, false, result);
			});
			return dropPromise;
		}

		qidb.get = getDB;
		qidb.dbList = dbList;

		// internal utilities
		function log(logInfo, isError) {
			if (isError) {
				console.error("QueueDB:", logInfo);
			} else {
				console.info("QueueDB:", logInfo);
			}
		}

		function call(cb, err, result) {
			switch (typeof cb) {
				case 'function':
					cb(err, result);
					break;
				case 'array':
					cb.push(result);
					break;
				case 'undefined':
					break;
				default:
					log(cb, true);
			}
		}

		function getDB(dbname) {
			if (dbList.has(dbname)) {
				return dbList.get(dbname);
			} else {
				var db = new QueueDatabase();
				db.name = dbname;
				dbList.set(dbname, db);
				return db;
			}
		}

		function openDBPromise(dbname) {

		}

		function requestPromise(idbRequest) {
			var deferred = Q.defer();
			idbRequest.onerror = function (ev) {
				deferred.reject(ev.target.error);
			}
			idbRequest.onsuccess = function (ev) {
				deferred.resolve(ev.target.result);
			}
			return deferred.promise;
		}

		// semi-private classes (only exposed to the user through callbacks)
		function QueueDatabase(dbname) {
			this.name = dbname;
			this.version = 0;
			this._isOpen = false;
			this._isCurrent = false;
			this._schema = null;
			this._db = null;
		}

		QueueDatabase.prototype = {
			isOpen: function () {
				if (!this._db) {
					return false;
				}
				return this._isOpen;
			},
			isCurrent: function () {
				return this._isCurrent;
			},
			setSchema: function (schema) {
				if (!this.isOpen()) {
					this._schema = schema;
					this._isCurrent = false;
				} else {
					log('Database: ' + this._db.name
						+ ' is already open, cannot set schema', true);
				}
			},
			setDatabase: function (iDatabase) {
				if (IDBDatabase.prototype.isPrototypeOf(iDatabase)) {
					this._db = iDatabase;
					this._isOpen = true;
					this.name = iDatabase.name;
					this.version = iDatabase.version;
				} else {
					throw Error("queueDB.database must be an instance of IDBDatabase");
				}
			},
			getDatabase: function () {
				return this._db;
			},
			checkVersion: function () {
				var self = this;
				// just check if objectStore and its indexes are the same
				// TODO check keyPaths in 'checkVersion'
				this._isCurrent = this._schema.collections.every(function (col) {
					if (!self._db.objectStoreNames.contains(col.name)) {
						return false;
					}
					;
					var indexNames = self._db.transaction(col.name).objectStore(
						col.name).indexNames;
					return col.indices.every(function (index) {
						return indexNames.contains(index.name);
					})
				})
				return this._isCurrent;
			},
			upgrade: function (transaction) {
				var self = this;
				// only allowed during 'VersionChange' event
				if (!this._schema) {
					console.log('Using default schema');
					this._schema = defaultSchema;
				}
				this._schema.collections.forEach(function (col) {
					if (!self._db.objectStoreNames.contains(col.name)) {
						var objStore = self._db.createObjectStore(col.name, {
							keyPath: col.keyPath,
							autoIncrement: col.autoIncrement
						});
						col.indices.forEach(function (index) {
							objStore.createIndex(index.name, index.keyPath, {
								unique: index.unique
							});
						});
					} else {
						var objStore = transaction.objectStore(col.name);
						col.indices.forEach(function (index) {
							if (objStore.indexNames.contains(index.name)) return;
							objStore.createIndex(index.name, index.keyPath, {
								unique: index.unique
							});
						});
					}
				});
				this._isCurrent = true;
			},
			collection: function (name) {
				var self = this;

				// change to implement QueueCursor instead of anonymous object
				return {
					find: function (oQuery) {
						// var query = this._parseQuery(oQuery); // not implemented
						var objectStore = self._db.transaction(name, 'readonly')
							.objectStore(name);
						if (typeof oQuery == 'string') {
							if (objectStore.indexNames.contains(oQuery)) {
								// oQuery is asking for all records in an index
								return new QueueCursor(objectStore.index(oQuery)
									.openCursor());
							}
							var keyRange = IDBKeyRange.bound(oQuery, oQuery);
							return new QueueCursor(objectStore.openCursor(keyRange));
						}

						// no query, so grab all records
						return new QueueCursor(objectStore.openCursor());
					},
					insert: function (oItem) {
						var objectStore = self._db.transaction(name, 'readwrite')
							.objectStore(name);
						return requestPromise(objectStore.add(oItem))
					},
					update: function (oItem) {
						var objectStore = self._db.transaction(name, 'readwrite')
							.objectStore(name);
						return requestPromise(objectStore.put(oItem))
					}
				}
				// return new QueueCollection(this, cName);
			},
			close: function () {
				if (this._db && this._db.close) {
					var self = this;
					var deferredCloseDB = Q.defer();
					var closeRequest = self._db.close();
					closeRequest.onsuccess = function (ev) {
						deferredCloseDB.resolve();
					};
					closeRequest.onerror = function (ev) {
						deferredCloseDB.reject(ev.target.error);
					};
					closeRequest.onblocked = function (ev) {
						deferredCloseDB.reject(ev.target.error);
					};
					deferredCloseDB.promise.then(function (success) {
						self._isOpen = false;
					},
						function (err) {
							if (err.type.includes('block')) {
								log('Database ' + self.name
									+ ' is still in use.', true);
							} else {
								log(err.target.error, true);
							}
						});
					return deferredCloseDB.promise;
				}
			},
			drop: function () {
				var self = this;
				// allow itself to be garbage collected
				self._isClosed = true;
				self._db = null;
			}
		};

		function QueueCollection(qDB, storeName) {
			this._qDB = qDB;
			this._name = storeName;
		}

		QueueCollection.prototype = {
			_parseQuery: function (oQuery) {
				if (!oQuery) {
					return "*"
				}
				var selection = Object.keys(oQuery)[0];
				switch (selection) {
					case '$eq':
						break;
					case '$gt':
						break;
					case '$gte':
						break;
					case '$lt':
						break;
					case '$lte':
						break;
					case '$and':
						break;
				}
			},
			find: function (oQuery) {
				var query = this._parseQuery(oQuery); // not implemented
				var objectStore = this._qDB.getDatabase().transaction(this._name)
					.objectStore(this._name);
				if (typeof oQuery == 'string') {
					if (this._store.indexNames.contains(oQuery)) {
						// oQuery is asking for all records in an index
						return new QueueCursor(objectStore.index(oQuery)
							.getCursor());
					}
					var keyRange = IDBKeyRange.bound(oQuery, oQuery);
					return new QueueCursor(objectStore.getCursor(keyRange));
				}

				return new QueueCursor(objectStore.getCursor());
			},
			insert: function (oItem) {
				var addPromise = Q.defer();
				var addRequest = this._store.add(oItem);
				addRequest.onsuccess = function (ev) {
					addPromise.resolve(ev.target.result);
				};
				addRequest.onerror = function (ev) {
					addPromise.reject(ev.target.error);
				};
				return addPromise.promise;
			},
			update: function (oQuery) {
				var updatePromise = Q.defer();
				var updateRequest = this._store.put(oItem);
				updateRequest.onsuccess = function (ev) {
					updatePromise.resolve(ev.target.result);
				};
				updateRequest.onerror = function (ev) {
					updatePromise.reject(ev.target.error);
				};
				return updatePromise.promise;
			}
		};

		/*
		 * function QueueTransaction(qDB, collection) { this.queryQueue = [];
		 * this.colllection = collection; this.qDB = qDB; }
		 */
		function QueueCursor(idbRequest, fFilter) {
			this._request = idbRequest;
			this._filter = fFilter || function () {
				return true;
			};// default to no filter
			this._isAlive = false;
		}

		QueueCursor.prototype = {
			isAlive: function () {
				return this._isAlive;
			},
			/**
			 * @function QueueCursor.each
			 * @param cb
			 *            Callback function with signature g(value, index)
			 */
			each: function (cb) {
				var def = Q.defer();
				var self = this;
				var counter = 0;
				this._request.onsuccess = function (ev) {
					if (ev && ev.target.result) {
						var cursor = ev.target.result;
						counter++;
						if (self._filter(cursor.value)) {
							call(cb, cursor.value, counter);
						}
						cursor['continue']();
					} else {
						def.resolve();
					}
				}
				this._request.onerror = function (err) {
					call(cb, err.target.error)
					def.reject(err.target.error);
				}
				return def.promise;
			},
			first: function (cb) {
				log('Cursor.first() not implemented', true)
			}
		}

		return qidb;
	}
})(this)