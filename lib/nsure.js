if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
	console.log('nsure @ NodeJS');
	var Minions = require('minions');
	var mongodb = require('mongodb');
	var ObjectID = mongodb.ObjectID;
}

// ---[[[ aError Object
var aError = function(code, msg, value) {
  this.code = code || '0';
  this.msg = msg || 'error';
  this.value = value || null;
};


// ---[[[ Nsure Object
var Nsure = function(rules) {
	this.version = '0.1.1';
	var thisNsure = this;
	this.rules = rules || {};	
	if (typeof this.rules.onError !== 'string' || typeof this[this.rules.onError] !== 'function') this.rules.onError = 'returnErrorMsg';
	this.model = this.createModel();
	// console.log('---MODEL---');
	// console.log(this.model);
	// console.log('---=====---');
};

var returnError = function(input, options, thisAttribute, fullInput, fullRules) {
  var error = new aError(options.error.code, options.error.msg, input);
	return error;
};


// ---[[[ create a object-model based on the given rules
Nsure.prototype.createModel = function() {
	var model = {};
	for (var key in this.rules.attributesToCheck) {
		var attr = this.rules.attributesToCheck[key];
		if (typeof attr === 'function') {
			attr = eval(attr);
		}
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
						var subNsure = new Nsure(attr.subNsure);
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
			if (typeof attr.defaultTo === 'object') {
				model[key] = minions.extendDeep(false, {}, attr.defaultTo);
			} else {
				model[key] = attr.defaultTo;
			}
		}
	}
	return model;
};


// ---[[[ check loop
Nsure.prototype.check = function(input, attributesToCheckList) {
	for (var n in input) {
		// attributesToCheckList is an array of attributes that should be checked, passively excluding others
		if (typeof attributesToCheckList === 'object' && attributesToCheckList.indexOf(n) === -1) {
			continue;
		}
		if (typeof this.rules.attributesToCheck[n] === 'function') {
			this.rules.attributesToCheck[n] = eval(this.rules.attributesToCheck[n]);
		}
		if (typeof this.rules.attributesToCheck[n] === 'object') {
			// console.log('---> CHECKING [%s]', n);
			for (var c = 0; c < this.rules.attributesToCheck[n].checks.length; c++) {
				var checkName = this.rules.attributesToCheck[n].checks[c];
				var checkNameBase = checkName.split('_')[0];
				if (typeof this.checks[checkNameBase] !== 'undefined') {
					// console.log('---> check [%s]', checkName);
					// console.log(input[n]);
					input[n] = this.checks[checkNameBase](input[n], this.rules.attributesToCheck[n][checkName], this.rules.attributesToCheck[n], input, this.rules);
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
	for (var n in this.rules.attributesToCheck) {
		// attributesToCheckList is an array of attributes that should be checked, passively excluding others
		if (typeof attributesToCheckList === 'object' && attributesToCheckList.indexOf(n) === -1) {
			continue;
		}
		if (typeof this.rules.attributesToCheck[n].enforcePresence === 'boolean' && this.rules.attributesToCheck[n].enforcePresence === true) {
			if (typeof input[n] === 'undefined') {
				if (typeof this.rules.attributesToCheck[n].defaultTo === 'function') {
					input[n] = this.rules.attributesToCheck[n].defaultTo();
				} else {
					input[n] = this.rules.attributesToCheck[n].defaultTo;
				}
			}
		}
	}
	return input;
};


// ---[[[ Error Variants Returning
Nsure.prototype.returnError = function(error) {
	return error;
};
Nsure.prototype.returnErrorMsg = function(error) {
	return error.msg;
};
Nsure.prototype.returnErrorCode = function(error) {
	return error.code;
};


// ---[[[ supplied checks
Nsure.prototype.checks = {};


// ---[[[ delete
Nsure.prototype.checks.deleteAttribute = function(input, key, rules) {
	delete input[key];
	return input;
};


// ---[[[ mongoId
Nsure.prototype.checks.mongoId = function(input, options, thisAttribute, fullInput, fullRules) {
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
Nsure.prototype.checks.mongoIdArray = function(input, options, thisAttribute, fullInput, fullRules) {
	var self = this;
	if (input instanceof Array) {
		var ret = [];
		for (var i = input.length - 1; i >= 0; i--) {
			var tmp = self.mongoId(input[i], options, thisAttribute, fullInput, fullRules);
			ret.push(tmp)
		};
		return ret;
	}
	return this.mongoIdArray[options.onFail](input, options);
};
Nsure.prototype.checks.mongoId.toFallback = function(input, options) {
	return new ObjectID();
};
Nsure.prototype.checks.mongoId.returnError = function(input, options, thisAttribute, fullInput, fullRules) {
  var error = new aError(options.error.code, options.error.msg, input);
	return error;
};
Nsure.prototype.checks.mongoIdArray.returnError = function(input, options, thisAttribute, fullInput, fullRules) {
  var error = new aError(options.error.code, options.error.msg, input);
	return error;
};


// ---[[[ subNsure
// this.checks[checkNameBase](input[n], this.rules.attributesToCheck[n][checkName], input, this.rules);
Nsure.prototype.checks.subNsure = function(input, options, thisAttribute, fullInput, fullRules) {
	var subNsure = new Nsure(options);
	// console.log('----- DEEP ENSURE in ---');
	// console.log(options);
	// console.log(input);
	var result = subNsure.check(input);
	// console.log('----- DEEP ENSURE result ---');
	// console.log(result);
	return result;
};


// ---[[[ type
Nsure.prototype.checks.type = function(input, options, thisAttribute, fullInput, fullRules) {
	// console.log(typeof input, input);
	if (typeof input === options.expected) return input;
	if (options.onFail === 'defaultTo' && typeof thisAttribute.defaultTo !== 'undefined') {
		if (typeof thisAttribute.defaultTo === 'function') {
			return thisAttribute.defaultTo(input, options, thisAttribute, fullInput, fullRules);
		} else {
			return thisAttribute.defaultTo;
		}
	}
	return this.type[options.onFail](input, options, thisAttribute, fullInput, fullRules);
};
Nsure.prototype.checks.type.toNumber = function(input, options, thisAttribute, fullInput, fullRules) {
	var aNumber = Number(input);
	if (isNaN(aNumber)) aNumber = this.checks.type.toNumber.toFallback(input, options, thisAttribute, fullInput, fullRules);
	return aNumber;
};
Nsure.prototype.checks.type.toInt = function(input, options, thisAttribute, fullInput, fullRules) {
	var aInt = parseInt(input);
	if (isNaN(aInt)) aInt = this.toNumber.toFallback(input, options, thisAttribute, fullInput, fullRules);
	return aInt;
};
Nsure.prototype.checks.type.toNumber.toFallback = function(input, options, thisAttribute, fullInput, fullRules) {
	return (typeof options.fallback === 'function') ? options.fallback(input, options, thisAttribute, fullInput, fullRules) : options.fallback;
};
Nsure.prototype.checks.type.toString = function(input, options, thisAttribute, fullInput, fullRules) {
	var aString = String(input);
	return aString;
};
Nsure.prototype.checks.type.toBoolean = function(input, options, thisAttribute, fullInput, fullRules) {
	var aBoolean = Boolean(input);
	if(typeof aBoolean !== 'boolean') aBoolean = true;
	return aBoolean;
};
Nsure.prototype.checks.type.toFallback = function(input, options, thisAttribute, fullInput, fullRules) {
	return (typeof options.fallback === 'function') ? options.fallback(input, options, thisAttribute, fullInput, fullRules) : options.fallback;
};
Nsure.prototype.checks.type.returnError = function(input, options, thisAttribute, fullInput, fullRules) {
	var error = new aError(options.error.code, options.error.msg, input);
	return error;
};


// ---[[[ regEx
Nsure.prototype.checks.regEx = function(input, options, thisAttribute, fullInput, fullRules) {	
	var validator = new RegExp(options.expression, options.flags);
	if (options.method === 'test') {
		if (validator.test(input) === true) {
			return input;
		} 
		return this.regEx[options.onFail](input, options, thisAttribute, fullInput, fullRules);
	} else if (options.method === 'execute') {
		var result = validator.exec(input);
		if (typeof options.executeReturn === 'number') return result[options.executeReturn];
		return result;
	}
	return input;
};
Nsure.prototype.checks.regEx.toFallback = function(input, options, thisAttribute, fullInput, fullRules) {
	return (typeof options.fallback === 'function') ? options.fallback(input, options, thisAttribute, fullInput, fullRules) : options.fallback;
};
Nsure.prototype.checks.regEx.returnError = function(input, options, thisAttribute, fullInput, fullRules) {
	var error = new aError(options.error.code, options.error.msg, input);
	return error;
};


// ---[[[ email
Nsure.prototype.checks.email = function(input, options, thisAttribute, fullInput, fullRules) {
	// test for email format
	var emailFormat = /^[a-z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+\/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;
	if (emailFormat.test(input) === true) return input;
	return this.email[options.onFail](input, options, thisAttribute, fullInput, fullRules);
};
Nsure.prototype.checks.email.returnError = function(input, options, thisAttribute, fullInput, fullRules) {
	var error = new aError(options.error.code, options.error.msg, input);
	return error;
};


// ---[[[ url
Nsure.prototype.checks.url = function(input, options, thisAttribute, fullInput, fullRules) {
	// test for url format
	var urlFormat = /[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/i;
	if (urlFormat.test(input) === true) return input;
	return this.url[options.onFail](input, options, thisAttribute, fullInput, fullRules);
};
Nsure.prototype.checks.url.returnError = function(input, options, thisAttribute, fullInput, fullRules) {
	var error = new aError(options.error.code, options.error.msg, input);
	return error;
};
Nsure.prototype.checks.url.toFallback = function(input, options, thisAttribute, fullInput, fullRules) {
	return (typeof options.fallback === 'function') ? options.fallback(input, options, thisAttribute, fullInput, fullRules) : options.fallback;
};


// ---[[[ replace
Nsure.prototype.checks.replace = function(input, options, thisAttribute, fullInput, fullRules) {	
	return input.replace(options.query, options.replacement);
};


// ---[[[ numberRange
Nsure.prototype.checks.numberRange = function(input, options, thisAttribute, fullInput, fullRules) {	
	if (input < options.min || input > options.max)	return this.numberRange[options.onFail](input, options, thisAttribute, fullInput, fullRules);
	return input;
};
Nsure.prototype.checks.numberRange.toBorder = function(input, options, thisAttribute, fullInput, fullRules) {
	if (input < options.min) return options.min;
	return options.max;
};
Nsure.prototype.checks.numberRange.toFallback = function(input, options, thisAttribute, fullInput, fullRules) {
	return (typeof options.fallback === 'function') ? options.fallback(input, options, thisAttribute, fullInput, fullRules) : options.fallback;
};
Nsure.prototype.checks.numberRange.returnError = function(input, options, thisAttribute, fullInput, fullRules) {
	var error = new aError(options.error.code, options.error.msg, input);
	return error;
};


// ---[[[ stringMaxLength
Nsure.prototype.checks.stringMaxLength = function(input, options, thisAttribute, fullInput, fullRules) {	
	if (input.length > options.max)	return this.stringMaxLength[options.onFail](input, options, thisAttribute, fullInput, fullRules);
	return input;
};
Nsure.prototype.checks.stringMaxLength.cut = function(input, options, thisAttribute, fullInput, fullRules) {
	if (input.length > options.max) return input.substr(0, options.max);
	return options.max;
};
Nsure.prototype.checks.stringMaxLength.returnError = function(input, options, thisAttribute, fullInput, fullRules) {
	var error = new aError(options.error.code, options.error.msg, input);
	return error;
};


// ---[[[ stringMinLength
Nsure.prototype.checks.stringMinLength = function(input, options, thisAttribute, fullInput, fullRules) {	
	if (input.length < options.min)	return this.stringMinLength[options.onFail](input, options, thisAttribute, fullInput, fullRules);
	return input;
};
Nsure.prototype.checks.stringMinLength.returnError = function(input, options, thisAttribute, fullInput, fullRules) {
	var error = new aError(options.error.code, options.error.msg, input);
	return error;
};


// ---[[[ isDefined
Nsure.prototype.checks.isDefined = function(input, options, thisAttribute, fullInput, fullRules) {	
	if (typeof input === 'undefined') {
		return this.isDefined[options.onFail](input, options);
	}		
	return input;
};
Nsure.prototype.checks.isDefined.returnError = function(input, options, thisAttribute, fullInput, fullRules) {
	var error = new aError(options.error.code, options.error.msg, input);
	return error;
};
Nsure.prototype.checks.isDefined.toFallback = function(input, options, thisAttribute, fullInput, fullRules) {
	return (typeof options.fallback === 'function') ? options.fallback(input, options, thisAttribute, fullInput, fullRules) : options.fallback;
};


// ---[[[ isInList
Nsure.prototype.checks.isInList = function(input, options, thisAttribute, fullInput, fullRules) {	
	if (
		typeof options.list !== 'object' 
		|| typeof options.list.indexOf !== 'function'
		|| options.list.indexOf(input) === -1
	) {
		return this.isInList[options.onFail](input, options);
	}
	return input;
};
Nsure.prototype.checks.isInList.returnError = function(input, options, thisAttribute, fullInput, fullRules) {
	var error = new aError(options.error.code, options.error.msg, input);
	return error;
};
Nsure.prototype.checks.isInList.toFallback = function(input, options, thisAttribute, fullInput, fullRules) {
	return (typeof options.fallback === 'function') ? options.fallback(input, options, thisAttribute, fullInput, fullRules) : options.fallback;
};



// ---[[[ helpers

Nsure.helpers = {};
Nsure.helpers.emailNsure = function() {
	var nsureRules = {
		enforcePresence: true,
		defaultTo: function() {
				return 'defaultEmail@nsure.org';
		},
		checks: [ 'type', 'stringMaxLength', 'replace_trim', 'email' ],
		type: {
				expected: 'string',
				onFail: [ 'returnError' ],
				error: {
						code: 'email.format',
						msg: '[email] needs to be valid, >6 chars and <80 chars.'
				}
		},
		stringMaxLength: {
				max: 80,
				onFail: [ 'returnError' ],
				error: {
						code: 'email.format',
						msg: '[email] needs to be valid, >6 chars and <80 chars.'
				}
		},
		replace_trim: {
				query: /^[\s]+|[\s]+$/g,
				replacement: ''
		},
		email: {
				onFail: [ 'returnError' ],
				error: {
						code: 'email.format',
						msg: '[email] needs to be valid, >6 chars and <80 chars.'
				}
		}
	};
	return nsureRules;
};

Nsure.helpers.urlNsure = function(maxLength, fallbackValue) {
	maxLength = minions.defaultTo(maxLength, 2048);
	fallbackValue = minions.defaultTo(fallbackValue, 'http://nsure.org/public');
	var nsureRules = {
		enforcePresence: true,
		defaultTo: fallbackValue,
		checks: [ 'type', 'stringMaxLength', 'replace_trim', 'url' ],
		type: {
			expected: 'string',
			onFail: [ 'toFallback' ],
			fallback: function(input, options, thisAttribute, fullInput, fullRules) { return fallbackValue; }
		},
		stringMaxLength: {
			max: maxLength,
			onFail: [ 'cut' ]
		},
		replace_trim: {
			query: /^[\s]+|[\s]+$/g,
			replacement: ''
		},
		url: {
			onFail: [ 'toFallback' ],
			fallback: function(input, options, thisAttribute, fullInput, fullRules) { return fallbackValue; }
		}
	};
	return nsureRules;
};


Nsure.helpers.stringNsure = function(maxLength, fallbackValue) {
	maxLength = minions.defaultTo(maxLength, 128);
	fallbackValue = minions.defaultTo(fallbackValue, '');
	var nsureRules = {
		enforcePresence: true,
		defaultTo: fallbackValue,
		checks: [ 'type', 'stringMaxLength', 'replace_trim' ],
		type: {
			expected: 'string',
			onFail: [ 'toFallback' ],
			fallback: function(input, options, thisAttribute, fullInput, fullRules) { return fallbackValue; }
		},
		stringMaxLength: {
			max: maxLength,
			onFail: [ 'cut' ]
		},
		replace_trim: {
			query: /^[\s]+|[\s]+$/g,
			replacement: ''
		}
	};
	return nsureRules;
};


Nsure.helpers.numberNsure = function(min, max, fallbackValue) {
	min = minions.defaultTo(min, 0); 
	max = minions.defaultTo(max, 10); 
	fallbackValue = minions.defaultTo(fallbackValue, Date.now());
	var nsureRules = {
		enforcePresence: true,
		defaultTo: fallbackValue,
		checks: [ 'type', 'numberRange' ],
		type: {
			expected: 'number',
			onFail: [ 'toFallback' ],
			fallback: function(input, options, thisAttribute, fullInput, fullRules) { return fallbackValue; }
		},
		numberRange: {
			min: min,
			max: max,
			onFail: [ 'toFallback' ],
			fallback: function(input, options, thisAttribute, fullInput, fullRules) { return fallbackValue; }
		}
	};
	return nsureRules;
};


Nsure.helpers.inListNsure = function(list, fallbackValue) {
	if (typeof fallbackValue === 'undefined') {
		fallbackValue = list[0];
	}
	var nsureRules = {		
		enforcePresence: true,
		defaultTo: fallbackValue,
		checks: [ 'isDefined', 'isInList' ],
		isDefined: {			
			onFail: [ 'toFallback' ],
			fallback: function(input, options, thisAttribute, fullInput, fullRules) { return fallbackValue; }
		},
		isInList: {
			list: list,
			onFail: [ 'toFallback' ],			
			fallback: function(input, options, thisAttribute, fullInput, fullRules) { return fallbackValue; }
		}
	};
	return nsureRules;
};



/* ----------------------------------------------------------------------------
 * -------------- register nsure with the system   -----------------------
 * --------------------------------------------------------------------------- 
 */
;( function() {

	if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
		module.exports = Nsure;
	} else {
		if (typeof window.minions !== 'object') {
			console.log('to work properly, nsure requires Minions');
		}
		console.log('nsure @ Browser');
		window.Nsure = Nsure;
	}
}() );

;
