/**
 * http://usejsdoc.org/
 */

function openDB() {
	qidb.setSchema('people', {
		collections : [ {
			name : 'family',
			keyPath : 'name',
			indices : [ {
				name : 'name-index',
				keyPath : 'name'
			}, {
				name : 'age-index',
				keyPath : 'age'
			} ]
		}, {
			name : 'friends',
			keyPath : 'name',
			indices : [ {
				name : 'name-index',
				keyPath : 'name'
			} ]
		} ]
	});
	
	qidb.connect('people', function(err, db) {
		if (err) {
			report(err);
			return 0;
		} else report(db);
	});
}

function report(txtObj) {
	txt = JSON.stringify(txtObj);
	console.trace(txtObj);
	$('#console').text(txt);
}

function add() {
	var person = readInput();
	qidb.connect('people', function(err, db) {
		db.collection('family').insert(person)['catch'](function(err) {
			db.collection('family').update(person);
		}).then(updateList('family'));
	})
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

function updateList(collection) {
	var ul = $('#db');
	var html = "";
	qidb.connect('people', function(err, db) {
		if (err) {
			console.log(err);
			return 0;
		}
		var crs = db.collection(collection).find();
		crs.each(function(person){
			html += "<li>" + JSON.stringify(person) + "</li>";
		}).then(function(res) {
			report(res);
			ul.html(html);
		}, function(err) {
			console.log(err)
		});
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
		updateList('family');
	});
});
