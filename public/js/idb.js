// create variable to hold db connection
let db;
// establish a connection to IndexDB 
const request = indexedDB.open('budget', 1);

request.onupgradeneeded = function(event) {
    // save a reference to the database
    const db = event.target.result;
    // create an object store 
    db.createObjectStore('new_item', { autoIncrement: true })
};

// upon success
request.onsuccess = function(event) {
    db = event.target.result;
    //check if app is online
    if (navigator.online) {
        checkDatabase();
    }
};

request.onerror = function(event) {
    console.log(event.target.errorCode);
};

// this function will be executed if we attempt to submit a new budget
function saveRecord(record) {
    //open a new transaction with the database with read and write permission
    const transaction = db.transaction(['new_item'], 'readwrite');

    //access the object store
    const budgetObjectStore = transaction.objectStore('new_item');

    // add record to your store
    budgetObjectStore.add(record);
}

function checkDatabase() {
    //open a transaction onur pending db
    const transaction = db.transaction(['new_item'], 'readwrite');
    // access your pending object store
    const budgetObjectStore = transaction.objectStore('new_item');
    // get all records from store and set to a variable
    const getAll = budgetObjectStore.getAll();

    getAll.onsuccess = function() {
        // if there was data in indexedDb's store, send it to the api server
        if (getAll.result.length > 0) {
          fetch('/api/transaction/bulk', {
            method: 'POST',
            body: JSON.stringify(getAll.result),
            headers: {
              Accept: 'application/json, text/plain, */*',
              'Content-Type': 'application/json'
            }
          })
            .then(response => response.json())
            .then(serverResponse => {
              if (serverResponse.message) {
                throw new Error(serverResponse);
              }
    
              const transaction = db.transaction(['new_item'], 'readwrite');
              const budgetObjectStore = transaction.objectStore('new_item');
              // clear all items in your store
              budgetObjectStore.clear();
            })
            .catch(err => {
              // set reference to redirect back here
              console.log(err);
            });
        }
    };
}

//check to see if online, if online, run checkDatabase
window.addEventListener('online', checkDatabase);
