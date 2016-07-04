/**
 * http://usejsdoc.org/
 */

var scope = {
	db : null,
};

function openDB() {
	var dbRequest = indexedDB.open('people', 1);
	dbRequest.onsuccess = function(event) {
		report(event);
		scope.db = event.target.result;
	};
	dbRequest.onupgradeneeded = function(event) {
		report(event);
		var db = event.target.result;
		var os = db.createObjectStore('people', {
			keyPath : 'id'
		});
		os.createIndex('name-index', 'name', {
			unique : false
		});
		os.createIndex('age-index', 'age', {
			unique : false
		});
		scope.db = db;
	};
	dbRequest.onerror = function(event) {
		report(event);
	};
}

function report(txtObj) {
	txt = JSON.stringify(txtObj);
	console.log(txtObj);
	$('#console').text(txt);
}

function add() {
	var person = readInput();
	var tx = scope.db.transaction('people', 'readwrite');
	var os = tx.objectStore('people');
	var req = os.add(person);
	report("adding " + person.name);
	req.onsuccess = function(ev) {
		report("added " + person.name);
		updateList();
	};
	req.onerror = function(ev) {
		report(ev);
	}
	tx.oncomplete = function(e) {
		report("addition complete")
	}
}

function readInput() {
	var person = {};
	("id name age").split(' ').forEach(function(value) {
		var item = $('#' + value).val()
		var prop;
		if (Number.isNaN(parseInt(item)))
			prop = item;
		else
			prop = parseInt(item);
		person[value] = prop;
	});
	return person;
}

function updateList() {
	var ul = $('#db');
	var html = "";
	var tx = scope.db.transaction('people', 'readonly');
	var os = tx.objectStore('people');
	var p = new Promise(function(res, rej) {
		var cursor = os.openCursor();
		cursor.onsuccess = function(event) {
			var c = event.target.result;
			if (c) {
				html += "<li>" + JSON.stringify(c.value) + "</li>";
				c['continue']();
			} else {
				res(html);
			}
		};
		cursor.onerror = rej;
	}).then(function(html) {
		ul.html(html);
	}, function(err) {
		console.log(err)
	});
}

$(document).ready(function() {
	$('#add').click(function(e) {
		add();
	});
	$('#open').click(function(e) {
		openDB();
	});
	$('#update').click(function(e) {
		updateList();
	});
});
