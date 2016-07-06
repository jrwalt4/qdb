namespace qdb {

    export class QdbDatabase {
        private _schema: QdbDatabaseSchema;
        constructor(private _db: IDBDatabase) {

        }
        schema(schema?: QdbDatabaseSchema) {
            if (schema !== void 0) {
                this._schema = schema;
            }
            return this._schema;
        }
        checkSchema(transaction:IDBTransaction):boolean {
            if (transaction.mode !== transaction.VERSION_CHANGE) {
                throw new Error('cannot check schema outside of VERSION_CHANGE event')
            }
            return true;
        }
        name():string {
            return this._db.name;
        }
        version():number {
            return this._db.version;
        }
    }


    
    interface QdbDatabaseSchema {
        name: string;
        collections: QdbCollectionSchema[]
    }

    interface QdbCollectionSchema {
        name: string;
        keyPath: string;
        autoIncrement: boolean;
        indices: QdbIndexSchema[]
    }

    interface QdbIndexSchema {
        name: string;
        index: string;

    }
}