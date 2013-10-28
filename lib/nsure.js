var mongodb = require('mongodb');
var ObjectID = mongodb.ObjectID;

// ---[[[ aError Object
var aError = function(code, msg, value) {
  this.code = code || '0';
  this.msg = msg || 'error';
  this.value = value || null;
};


// ---[[[ aNsure Object
var aNsure = function(rules) {
	this.version = '0.1.1';
	var thisNsure = this;
	this.rules = rules;	
	if (typeof this.rules.onError !== 'string' || typeof this[this.rules.onError] !== 'function') this.rules.onError = 'returnErrorMsg';
	this.model = this.createModel();
	// console.log('---MODEL---');
	// console.log(this.model);
	// console.log('---=====---');
};

var returnError = function(input, options, fullInput, fullRules) {
  var error = new aError(options.error.code, options.error.msg, input);
	return error;
};


// ---[[[ create a object-model based on the given rules
aNsure.prototype.createModel = function() {
	var model = {};
	for (var key in this.rules.attributesToCheck) {
		var attr = this.rules.attributesToCheck[key];
		if (typeof attr.defaultTo === 'undefined') {
			if (typeof attr.type === 'object' && typeof attr.type.expected === 'string') {
				if (attr.type.expected.toLowerCase() === 'string') {
					model[key] = '';
				} else if (attr.type.expected.toLowerCase() === 'array') {
					model[key] = [];
				} else if (attr.type.expected.toLowerCase() === 'object') {
					model[key] = {};
					if (typeof attr.subNsure === 'object') {
						// console.log('!!!!');
						var subNsure = new aNsure(attr.subNsure);
						// console.log(subNsure.model);
						model[key] = subNsure.model;
					}
				} else if (attr.type.expected.toLowerCase() === 'mongoid') {
					model[key] = new ObjectID();
				} else if (attr.type.expected.toLowerCase() === 'number') {
					model[key] = 1337;
				} else if (attr.type.expected.toLowerCase() === 'boolean') {
					model[key] = false;
				}
			} else if (typeof attr.checks === 'object' && attr.checks instanceof Array) {
				if (attr.checks.indexOf('mongoId') > -1) {
					model[key] = new ObjectID();
				} else if (attr.checks.indexOf('regEx') > -1) {
					model[key] = '';
				}
			}
		} else if (typeof attr.defaultTo === 'function') {
			model[key] = attr.defaultTo();
		} else {
			model[key] = minions.extendDeep(false, {}, attr.defaultTo);
		}
	}
	return model;
};

// ---[[[ check loop
aNsure.prototype.check = function(input) {
	for (var n in input) {
		if (typeof this.rules.attributesToCheck[n] === 'object') {
			// console.log('---> CHECKING [%s]', n);
			for (var c = 0; c < this.rules.attributesToCheck[n].checks.length; c++) {
				var checkName = this.rules.attributesToCheck[n].checks[c];
				var checkNameBase = checkName.split('_')[0];
				if (typeof this.checks[checkNameBase] !== 'undefined') {
					// console.log('---> check [%s]', checkName);
					// console.log(input[n]);
					input[n] = this.checks[checkNameBase](input[n], this.rules.attributesToCheck[n][checkName], input, this.rules);
					if (input[n] instanceof Array) {
						for (var i in input[n]) {
							if (typeof input[n][i] === 'object' && input[n][i] instanceof aError) {
								var ret = this[this.rules.onError](input[n][i], input, this.rules);
								return ret;
							}
						}
					}
					if (typeof input[n] === 'object' && input[n] instanceof aError) {
						return this[this.rules.onError](input[n], input, this.rules);
					}
				}
			}
		} else {
			if (typeof this.rules.onUnruledAttributes === 'object') {
				for (var u=0; u<this.rules.onUnruledAttributes.length; u++) {
					var checkName = this.rules.onUnruledAttributes[u];
					input = this.checks[checkName](input, n, this.rules, input, this.rules);
				}
			}
		}
	}
	return input;
};


// ---[[[ Error Variants Returning
aNsure.prototype.returnError = function(error) {
	return error;
};
aNsure.prototype.returnErrorMsg = function(error) {
	return error.msg;
};
aNsure.prototype.returnErrorCode = function(error) {
	return error.code;
};


// ---[[[ supplied checks
aNsure.prototype.checks = {};


// ---[[[ delete
aNsure.prototype.checks.deleteAttribute = function(input, key, rules) {
	delete input[key];
	return input;
};


// ---[[[ mongoId
aNsure.prototype.checks.mongoId = function(input, options, fullInput, fullRules) {
	if (typeof input === 'object' && typeof input.toHexString === 'function') {
		return input;
	} else if (typeof input === 'string') {
		var checkForHexRegExp = new RegExp('^[0-9a-fA-F]{24}$');
		if (checkForHexRegExp.test(input) === true) {
			var ret = new ObjectID.createFromHexString(input);
			return ret;
		}
	}
	return this.mongoId[options.onFail](input, options);
};
aNsure.prototype.checks.mongoIdArray = function(input, options, fullInput, fullRules) {
	var self = this;
	if (input instanceof Array) {
		var ret = [];
		for (var i = input.length - 1; i >= 0; i--) {
			var tmp = self.mongoId(input[i], options, fullInput, fullRules);
			ret.push(tmp)
		};
		return ret;
	}
	return this.mongoIdArray[options.onFail](input, options);
};
aNsure.prototype.checks.mongoId.toFallback = function(input, options) {
	return new ObjectID();
};
aNsure.prototype.checks.mongoId.returnError = function(input, options, fullInput, fullRules) {
  var error = new aError(options.error.code, options.error.msg, input);
	return error;
};
aNsure.prototype.checks.mongoIdArray.returnError = function(input, options, fullInput, fullRules) {
  var error = new aError(options.error.code, options.error.msg, input);
	return error;
};


// ---[[[ subNsure
// this.checks[checkNameBase](input[n], this.rules.attributesToCheck[n][checkName], input, this.rules);
aNsure.prototype.checks.subNsure = function(input, options, fullInput, fullRules) {
	var subNsure = new aNsure(options);
	// console.log('----- DEEP ENSURE in ---');
	// console.log(options);
	// console.log(input);
	var result = subNsure.check(input);
	// console.log('----- DEEP ENSURE result ---');
	// console.log(result);
	return result;
};


// ---[[[ type
aNsure.prototype.checks.type = function(input, options, fullInput, fullRules) {
	// console.log(typeof input, input);
	if (typeof input === options.expected) return input;
	return this.type[options.onFail](input, options, fullInput, fullRules);
};
aNsure.prototype.checks.type.toNumber = function(input, options, fullInput, fullRules) {
	var aNumber = Number(input);
	if (isNaN(aNumber)) aNumber = this.checks.type.toNumber.toFallback(input, options, fullInput, fullRules);
	return aNumber;
};
aNsure.prototype.checks.type.toInt = function(input, options, fullInput, fullRules) {
	var aInt = parseInt(input);
	if (isNaN(aInt)) aInt = this.toNumber.toFallback(input, options, fullInput, fullRules);
	return aInt;
};
aNsure.prototype.checks.type.toNumber.toFallback = function(input, options, fullInput, fullRules) {
	return (typeof options.fallback === 'function') ? options.fallback(input, options, fullInput, fullRules) : options.fallback;
};
aNsure.prototype.checks.type.toString = function(input, options, fullInput, fullRules) {
	var aString = String(input);
	return aString;
};
aNsure.prototype.checks.type.toBoolean = function(input, options, fullInput, fullRules) {
	var aBoolean = Boolean(input);
	if(typeof aBoolean !== 'boolean') aBoolean = true;
	return aBoolean;
};
aNsure.prototype.checks.type.toFallback = function(input, options, fullInput, fullRules) {
	return (typeof options.fallback === 'function') ? options.fallback(input, options, fullInput, fullRules) : options.fallback;
};
aNsure.prototype.checks.type.returnError = function(input, options, fullInput, fullRules) {
	var error = new aError(options.error.code, options.error.msg, input);
	return error;
};


// ---[[[ regEx
aNsure.prototype.checks.regEx = function(input, options, fullInput, fullRules) {	
	var validator = new RegExp(options.expression, options.flags);
	if (options.method === 'test') {
		if (validator.test(input) === true) {
			return input;
		} 
		return this.regEx[options.onFail](input, options, fullInput, fullRules);
	} else if (options.method === 'execute') {
		var result = validator.exec(input);
		if (typeof options.executeReturn === 'number') return result[options.executeReturn];
		return result;
	}
	return input;
};
aNsure.prototype.checks.regEx.toFallback = function(input, options, fullInput, fullRules) {
	return (typeof options.fallback === 'function') ? options.fallback(input, options, fullInput, fullRules) : options.fallback;
};
aNsure.prototype.checks.regEx.returnError = function(input, options, fullInput, fullRules) {
	var error = new aError(options.error.code, options.error.msg, input);
	return error;
};


// ---[[[ email
aNsure.prototype.checks.email = function(input, options, fullInput, fullRules) {
	// test for email format
	var emailFormat = /^[a-z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+\/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;
	if (emailFormat.test(input) === true) return input;
	return this.email[options.onFail](input, options, fullInput, fullRules);
};
aNsure.prototype.checks.email.returnError = function(input, options, fullInput, fullRules) {
	var error = new aError(options.error.code, options.error.msg, input);
	return error;
};


// ---[[[ replace
aNsure.prototype.checks.replace = function(input, options, fullInput, fullRules) {	
	return input.replace(options.query, options.replacement);
};


// ---[[[ numberRange
aNsure.prototype.checks.numberRange = function(input, options, fullInput, fullRules) {	
	if (input < options.min || input > options.max)	return this.numberRange[options.onFail](input, options, fullInput, fullRules);
	return input;
};
aNsure.prototype.checks.numberRange.toBorder = function(input, options, fullInput, fullRules) {
	if (input < options.min) return options.min;
	return options.max;
};
aNsure.prototype.checks.numberRange.toFallback = function(input, options, fullInput, fullRules) {
	return (typeof options.fallback === 'function') ? options.fallback(input, options, fullInput, fullRules) : options.fallback;
};
aNsure.prototype.checks.numberRange.returnError = function(input, options, fullInput, fullRules) {
	var error = new aError(options.error.code, options.error.msg, input);
	return error;
};


// ---[[[ stringMaxLength
aNsure.prototype.checks.stringMaxLength = function(input, options, fullInput, fullRules) {	
	if (input.length > options.max)	return this.stringMaxLength[options.onFail](input, options, fullInput, fullRules);
	return input;
};
aNsure.prototype.checks.stringMaxLength.cut = function(input, options, fullInput, fullRules) {
	if (input.length > options.max) return input.substr(0, options.max);
	return options.max;
};
aNsure.prototype.checks.stringMaxLength.returnError = function(input, options, fullInput, fullRules) {
	var error = new aError(options.error.code, options.error.msg, input);
	return error;
};


// ---[[[ stringMinLength
aNsure.prototype.checks.stringMinLength = function(input, options, fullInput, fullRules) {	
	if (input.length < options.min)	return this.stringMinLength[options.onFail](input, options, fullInput, fullRules);
	return input;
};
aNsure.prototype.checks.stringMinLength.returnError = function(input, options, fullInput, fullRules) {
	var error = new aError(options.error.code, options.error.msg, input);
	return error;
};


module.exports = aNsure;
