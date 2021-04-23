// create a variable to hold db connection
let db;

const request = indexedDB.open('budget', 1);

request.onupgradeneeded = function(event) {
    const db = event.target.result;
    db.createObjectStore('new_transaction', { autoIncrement: true });
};

request.onsuccess = function(event) {
    // when db is successfully created with its object store (from onupgradedneeded event above), save reference to db in global variable
    db = event.target.result;

    // check if app is online, if yes run checkDatabase() function to send all local db data to api
    if (navigator.onLine) {
        uploadTransaction();
    }
};

request.onerror = function(event) {
    //log error here
    console.log(event.target.errorCode);
};

function saveRecord(record) {
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    const transactionObjectStore = transaction.objectStore('new_transaction');

    // add record to your store with add method.
    transactionObjectStore.add(record);

}

function uploadTransaction() {
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    //access your object store
    const transactionObjectStore = transaction.objectStore('new_transaction');

    // get all records from store and set to a variable
    const getAll = transactionObjectStore.getAll();

    // upon a successful .getAll() execution, run this function
    getAll.onsuccess = function() {
        // if there was data in indexedDb's store, let's send it to the api server
        if (getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': "application/json"
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if (serverResponse.message) {
                    throw new Error(serverResponse);
                }
                // open one more transaction
                const transaction = db.transaction(['new_transaction'], 'readwrite');
                //access the new_transaction object store
                const transactionObjectStore = transaction.objectStore('new_transaction');
                // clear all items in store
                transactionObjectStore.clear();

                alert('All saved pizza has been submitted!');
            })
            .catch(err => {
                console.log(err);
            });
        }
    }
};

//listen for app comming back online

window.addEventListener('online', uploadTransaction);