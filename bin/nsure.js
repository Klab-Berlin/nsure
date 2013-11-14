#!/usr/bin/env node

var nsure = require('../lib/nsure');

if (typeof process.argv[2] === 'undefined' || typeof process.argv[2] === 'undefined') {
	console.log('nSURE ---[[[ Usage: nsure <rulesFile> <dataFile> ]]]---');
	process.exit();
}

var fs = require('fs');
var path = require('path');

var ruleFilePath = path.normalize(process.argv[2]);
ruleFilePath = path.resolve(ruleFilePath, process.cwd()) + '/' + ruleFilePath;
var rules = require(ruleFilePath);

var testEnsure = new nsure(rules);

var dataFilePath = path.normalize(process.argv[3]);
dataFilePath = path.resolve(dataFilePath, process.cwd()) + '/' + dataFilePath;
var testData = require(dataFilePath);

console.log();
console.log('\u001b[1;4;34mnsurez');
console.log('\u001b[0;0;37m===============[[[[ RULES ---\u001b[0;1;32m');
console.log(rules);

console.log('\u001b[0;0;37m===============[[[[ MODEL ---\u001b[1;1;35m');
console.log(testEnsure.model);

if (testData instanceof Array) {
	for (var n = 0; n < testData.length; n+=1) {
		test(testData[n], n);
	}
} else {
	test(testData, n);
}

console.log();
console.log();

function test(data, counter) {
	console.log('\u001b[0;0;37m==================[[[[ TEST [%s] ====', (counter) ? counter:0);
	console.log('\u001b[0;0;37m----------[[[ DATA ------------\u001b[0;1;32m');
	console.log(data);
	var result = testEnsure.check(data);
	console.log('\u001b[0;0;37m----------[[[ RESULT ----------\u001b[1;33;40m');
	console.dir(result);
};