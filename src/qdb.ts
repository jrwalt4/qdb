interface Window {
    Promise: typeof Q
}

namespace qdb {
    declare interface QdbPromise extends Q.Promise<QdbDatabase> { }

    if (typeof Q === void 0) {
        if (typeof window.Promise === void 0) {
            throw Error("No Promise library detected");
        } else {
            var Q = window.Promise;
            Q.Promise = window.Promise;
        }

    }


    export function open(name: string): QdbPromise {
        return openDB(name);

    }

    function openDB(name: string, version: number = 1): QdbPromise {
        return Q.Promise(function (resolve: (QdbDatabase) => void, reject: (reason: any) => void) {
            var request: IDBRequest = indexedDB.open(name);
            request.onsuccess = function () {
                resolve(new QdbDatabase(request.result));
            }
        })
    }
}