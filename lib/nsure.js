if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
	console.log('nsure @ NodeJS');
	var Minions = require('minions');
	var mongodb = require('mongodb');
	var ObjectID = mongodb.ObjectID;
}

if (typeof aError === 'undefined') {
	// ---[[[ aError Object
	var aError = function(code, msg, value, logLevel) {
		this.aError = true;
		this.code = code || '0';
		this.msg = msg || 'error';
		this.value = value || null;
		if (typeof logLevel === 'number') log.add({msg: msg, error: value}, 'error', 'aError', logLevel);
	};

	aError.isError = function(thing) {
		if (
			typeof thing === 'object' 
			&& ( typeof thing.code === 'string' || typeof thing.code === 'number' )
			&& typeof thing.msg === 'string'
			&& typeof thing.aError === 'boolean' && thing.aError === true
		) {
			return true;
		}
		return false;
	};
}

// ---[[[ Nsure Object
var Nsure = function(rules) {
	this.version = '0.2.0';
	var thisNsure = this;
	this.rules = rules || {};	
	if (typeof this.rules.onError !== 'string' || typeof this[this.rules.onError] !== 'function') {
		this.rules.onError = 'returnError';
	}
	this.model = this.createModel();
	// console.log('---MODEL---');
	// console.log(this.model);
	// console.log('---=====---');
};


var returnError = function(input, options, thisAttribute, fullInput, fullRules) {
  if (input instanceof aError) {
		return input;
	}
	var error = new aError(options.error.code, options.error.msg, input);
	return error;
};


// ---[[[ create a object-model based on the given rules
Nsure.prototype.createModel = function() {
	var model = {};
	try {
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
						if (typeof ObjectID === 'function') {
							model[key] = new ObjectID();
						} else {
							// we could generate an actual objectId, but it's shooting too high i believe
							// optionally, include this: https://github.com/justaprogrammer/ObjectId.js/blob/master/src/main/javascript/Objectid.js
							model[key] = minions.randomString(24, true, true, false);
						}
					} else if (attr.checks.indexOf('regEx') > -1) {
						model[key] = '';
					}
				}
			} else if (typeof attr.defaultTo === 'function') {
				model[key] = attr.defaultTo(null, key, this.rules.attributesToCheck[key], model, this.rules);
			} else {
				if (typeof attr.defaultTo === 'object' && attr.defaultTo instanceof Array === false) {
					model[key] = minions.extendDeep(false, {}, attr.defaultTo);
				} else {
					model[key] = attr.defaultTo;
				}
			}
		}
	} catch(err) {
		console.error('[ERROR in nsure.createModel] : for key: ' + key);
		// console.error(attr);
		throw(err);
	}
	return model;
};


// ---[[[ check loop
Nsure.prototype.check = function(input, attributesToCheckList) {
	try {
		for (var n in input) {
			// attributesToCheckList is an array of attributes that should be checked, passively excluding others
			var skip = false;
			if (typeof attributesToCheckList === 'object' && attributesToCheckList.indexOf(n) === -1) {
				skip = true;
			}
			if (skip === false && typeof this.rules.attributesToCheck[n] === 'function') {
				this.rules.attributesToCheck[n] = this.rules.attributesToCheck[n]();
			}
			if (skip === false && typeof this.rules.attributesToCheck[n] === 'object') {
				// console.log('---> CHECKING [%s]', n);
				if (
					typeof this.rules.attributesToCheck[n].checks !== 'object' 
					|| this.rules.attributesToCheck[n].checks instanceof Array === false
				) {
					var msg = 'NO CHECKS DEFINED FOR [' + n + ']';
					// console.log(msg);
					input[n] = new aError('nsure_ncd', msg, n);
					return this[this.rules.onError](input[n], input, this.rules);
				}
				for (var c = 0; c < this.rules.attributesToCheck[n].checks.length; c++) {
					var checkName = this.rules.attributesToCheck[n].checks[c];
					var checkNameBase = checkName.split('_')[0];
					if (typeof this.checks[checkNameBase] !== 'undefined') {
						// console.log('---> check [%s]', checkName);
						// console.log(input[n]);
						input[n] = this.checks[checkNameBase](
							input[n], 
							this.rules.attributesToCheck[n][checkName], 
							this.rules.attributesToCheck[n], 
							input, 
							this.rules
						);
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
						input = this.checks[checkName](input[n], n, this.rules, input, this.rules);
					}
				}
			}
		}
		for (var n in this.rules.attributesToCheck) {
			// attributesToCheckList is an array of attributes that should be checked, passively excluding others
			if (typeof attributesToCheckList === 'object' && attributesToCheckList.indexOf(n) === -1) {
				continue;
			}
			if (
				typeof this.rules.attributesToCheck[n].enforcePresence === 'boolean' 
				&& this.rules.attributesToCheck[n].enforcePresence === true
			) {
				if (typeof input[n] === 'undefined') {
					if (typeof this.rules.attributesToCheck[n].defaultTo === 'function') {
						input[n] = this.rules.attributesToCheck[n].defaultTo(input[n], n, this.rules.attributesToCheck[n], input, this.rules);
					} else {
						input[n] = this.rules.attributesToCheck[n].defaultTo;
					}
				}
			}
		}
	} catch(err) {
		console.error('[ERROR in nsure.check] : for key: ' + n);
		// console.error(this.rules.attributesToCheck[n]);
		throw(err);
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


// ---[[[ object
Nsure.prototype.checks.isObject = function(input, options, thisAttribute, fullInput, fullRules) {
	if (typeof input === 'object' && input instanceof Array === false) {
		return input;
	}
	return this.isObject[options.onFail](input, options);
};
Nsure.prototype.checks.isObject.toFallback = function(input, options) {
	return (typeof options.fallback === 'function') 
		? 
			options.fallback(input, options, thisAttribute, fullInput, fullRules) 
		: 
			options.fallback
	;
};
Nsure.prototype.checks.isObject.returnError = function(input, options, thisAttribute, fullInput, fullRules) {
  var error = new aError(options.error.code, options.error.msg, input);
	return error;
};


// ---[[[ array
Nsure.prototype.checks.isArray = function(input, options, thisAttribute, fullInput, fullRules) {
	if (typeof input === 'object' && input instanceof Array) {
		return input;
	}
	return this.isArray[options.onFail](input, options);
};
Nsure.prototype.checks.isArray.toFallback = function(input, options) {
	return (typeof options.fallback === 'function') ? options.fallback(input, options, thisAttribute, fullInput, fullRules) : options.fallback;
};
Nsure.prototype.checks.isArray.returnError = function(input, options, thisAttribute, fullInput, fullRules) {
  var error = new aError(options.error.code, options.error.msg, input);
	return error;
};



// ---[[[ delete
Nsure.prototype.checks.deleteAttribute = function(input, key, rules) {
	if (typeof input !== 'object') {
		input = {};
	}
	if (
		input !== null 
		&& typeof input[key] === 'undefined'
	) {
		delete input[key];
	}
	return input;
};


// ---[[[ mongoId
Nsure.prototype.checks.mongoId = function(input, options, thisAttribute, fullInput, fullRules) {
	if (typeof input === 'object' && typeof input.toHexString === 'function') {
		return input;
	} else if (typeof input === 'string') {
		var checkForHexRegExp = new RegExp('^[0-9a-fA-F]{24}$');
		if (checkForHexRegExp.test(input) === true && typeof ObjectID === 'function') {
			var ret = new ObjectID.createFromHexString(input);
			return ret;
		} else if (checkForHexRegExp.test(input) === true && typeof ObjectID !== 'function') {
			return input;
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
	if (
		options.expected.toLowerCase() === 'array' 
		&& typeof input === 'object' 
		&& input instanceof Array
	) {
		return input;
	}
	if (options.expected.toLowerCase() === 'date'
		&& typeof input === 'object' 
		&& input instanceof Date
	) {
		return input;
	}
	if (typeof input === options.expected) {
		return input;
	}
	if (
		typeof options.onFail === 'undefined' 
		|| (options.onFail !== 'defaultTo' && typeof this.type[options.onFail] !== 'function')
	) {
		options.onFail = 'defaultTo';
	}
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
	if (typeof aBoolean !== 'boolean') aBoolean = true;
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


// ---[[[ arrayOf
Nsure.prototype.checks.arrayOf = function(input, options, thisAttribute, fullInput, fullRules) {
	return this.arrayOf.checkArray(input, options, thisAttribute, fullInput, fullRules);
};
Nsure.prototype.checks.arrayOf.checkArray = function(input, options, thisAttribute, fullInput, fullRules) {
	if (typeof input !== 'object' || input instanceof Array === false) {
		return (typeof options.fallback === 'function') 
			? 
				options.fallback(input, options, thisAttribute, fullInput, fullRules) 
			: 
				options.fallback
		; 
	}
	for (var i = input.length - 1; i > -1; i -= 1) {
		var lowerType = (typeof input[i]).toLowerCase();
		if (
			( 
				typeof options.allowedTypes === 'object' 
				&& options.allowedTypes.length > 0 
				&& options.allowedTypes.indexOf(lowerType) === -1 
			)
			|| 
			( 
				typeof options.allowedValues === 'object' 
				&& options.allowedValues.length > 0 
				&& options.allowedValues.indexOf(input[i]) === -1 
			)
		) {
			input.splice(i, 1);
		}
		if (typeof options.subNsure === 'object') {
			var subNsure = new Nsure(options.subNsure);
			var result = subNsure.check(input[i]);
			input[i] = result;
		}
	}
	return input;
};
Nsure.prototype.checks.arrayOf.returnError = function(input, options, thisAttribute, fullInput, fullRules) {
	var error = new aError(options.error.code, options.error.msg, input);
	return error;
};
Nsure.prototype.checks.arrayOf.toFallback = function(input, options, thisAttribute, fullInput, fullRules) {
	return (typeof options.fallback === 'function') ? options.fallback(input, options, thisAttribute, fullInput, fullRules) : options.fallback;
};


// ---[[[ objectOf
Nsure.prototype.checks.objectOf = function(input, options, thisAttribute, fullInput, fullRules) {
	return this.objectOf.checkObject(input, options, thisAttribute, fullInput, fullRules);
};
Nsure.prototype.checks.objectOf.checkObject = function(input, options, thisAttribute, fullInput, fullRules) {
	if (typeof input !== 'object' || input instanceof Object === false) {
		return (typeof options.fallback === 'function') ? options.fallback(input, options, thisAttribute, fullInput, fullRules) : options.fallback; 
	}
	for (var i in input) {
		var lowerType = (typeof input[i]).toLowerCase();
		if (
			( typeof options.allowedTypes === 'object' && options.allowedTypes.length > 0 && options.allowedTypes.indexOf(lowerType) === -1 )
			|| 
			( typeof options.allowedValues === 'object' && options.allowedValues.length > 0 && options.allowedValues.indexOf(input[i]) === -1 )
			|| 
			( typeof options.allowedKeys === 'object' && options.allowedKeys.length > 0 && options.allowedKeys.indexOf(i) === -1 )
			||
			( typeof options.allowedTypes === 'function' && options.allowedTypes(i, input[i]) !== true )
			|| 
			( typeof options.allowedValues === 'function' && options.allowedValues(i, input[i]) !== true )
			|| 
			( typeof options.allowedKeys === 'function' && options.allowedKeys(i, input[i]) !== true )
		) {
			delete input[i];
		}
	}
	return input;
};
Nsure.prototype.checks.objectOf.returnError = function(input, options, thisAttribute, fullInput, fullRules) {
	var error = new aError(options.error.code, options.error.msg, input);
	return error;
};
Nsure.prototype.checks.objectOf.toFallback = function(input, options, thisAttribute, fullInput, fullRules) {
	return (typeof options.fallback === 'function') ? options.fallback(input, options, thisAttribute, fullInput, fullRules) : options.fallback;
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


// ---[[[ isDate
Nsure.prototype.checks.isDate = function(input, options, thisAttribute, fullInput, fullRules) {	
	try {
		var now = new Date(input);
		var nowMS = now.getTime();
		if (isNaN(nowMS) === true || nowMS === 0) {
			return this.isDate[options.onFail](input, options);
		}
	} catch(err) {
		return this.isDate[options.onFail](input, options);
	}
	return input;
};
Nsure.prototype.checks.isDate.returnError = function(input, options, thisAttribute, fullInput, fullRules) {
	var error = new aError(options.error.code, options.error.msg, input);
	return error;
};
Nsure.prototype.checks.isDate.toFallback = function(input, options, thisAttribute, fullInput, fullRules) {
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
Nsure.helpers.emailNsure = function(enforce) {
	if (typeof enforce !== 'boolean') {
		enforce = true;
	}
	var nsureRules = {
		enforcePresence: enforce,
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

Nsure.helpers.urlNsure = function(maxLength, fallbackValue, enforce) {
	if (typeof enforce !== 'boolean') {
		enforce = true;
	}
	maxLength = minions.defaultTo(maxLength, 2048);
	fallbackValue = minions.defaultTo(fallbackValue, 'http://nsure.org/public');
	var nsureRules = {
		enforcePresence: enforce,
		defaultTo: fallbackValue,
		checks: [ 'type', 'stringMaxLength', 'replace_trim', 'url' ],
		type: {
			expected: 'string',
			onFail: [ 'toFallback' ],
			fallback: fallbackValue
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
			fallback: fallbackValue
		}
	};
	return nsureRules;
};


Nsure.helpers.stringNsure = function(maxLength, fallbackValue, enforce) {
	if (typeof enforce !== 'boolean') {
		enforce = true;
	}
	maxLength = minions.defaultTo(maxLength, 128);
	fallbackValue = minions.defaultTo(fallbackValue, '');
	var nsureRules = {
		enforcePresence: enforce,
		defaultTo: fallbackValue,
		checks: [ 'type', 'stringMaxLength', 'replace_trim' ],
		type: {
			expected: 'string',
			onFail: [ 'toFallback' ],
			fallback: fallbackValue
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


Nsure.helpers.numberNsure = function(min, max, fallbackValue, enforce) {
	if (typeof enforce !== 'boolean') {
		enforce = true;
	}
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
			fallback: fallbackValue
		},
		numberRange: {
			min: min,
			max: max,
			onFail: [ 'toFallback' ],
			fallback: fallbackValue
		}
	};
	return nsureRules;
};


Nsure.helpers.inListNsure = function(list, fallbackValue, enforce) {
	if (typeof enforce !== 'boolean') {
		enforce = true;
	}
	if (typeof fallbackValue === 'undefined') {
		fallbackValue = list[0];
	}
	var nsureRules = {		
		enforcePresence: enforce,
		defaultTo: fallbackValue,
		checks: [ 'isDefined', 'isInList' ],
		isDefined: {			
			onFail: [ 'toFallback' ],
			fallback: fallbackValue
		},
		isInList: {
			list: list,
			onFail: [ 'toFallback' ],			
			fallback: fallbackValue
		}
	};
	return nsureRules;
};

Nsure.helpers.dateNsure = function(fallbackValue, enforce) {
	if (typeof enforce !== 'boolean') {
		enforce = true;
	}
	if (typeof fallbackValue === 'undefined') {
		fallbackValue = Date.now();
	}
	var nsureRules = {		
		enforcePresence: enforce,
		defaultTo: fallbackValue,
		checks: [ 'isDefined', 'isDate' ],
		isDefined: {			
			onFail: [ 'toFallback' ],
			fallback: fallbackValue
		},
		isDate: {
			onFail: [ 'toFallback' ],			
			fallback: fallbackValue
		}
	};
	return nsureRules;
};


Nsure.helpers.boolNsure = function(fallbackValue, enforce) {
	if (typeof fallbackValue !== 'boolean') {
		fallbackValue = true;
	}
	if (typeof enforce !== 'boolean') {
		enforce = true;
	}
	var nsureRules = {		
		enforcePresence: enforce,
		defaultTo: fallbackValue,
		checks: [ 'type' ],
		type: {
			expected: 'boolean',
			onFail: [ 'onFail' ]
		}
	};
	return nsureRules;
};


Nsure.helpers.arrayOfNsure = function(typeArray, valueArray, fallbackValue, enforce) {
	if (typeof enforce !== 'boolean') {
		enforce = true;
	}
	var nsureRules = {		
		enforcePresence: enforce,
		defaultTo: fallbackValue,
		checks: [ 'isArray', 'arrayOf' ],
		isArray: {
			onFail: [ 'toFallback' ],
			fallback: fallbackValue
		},
		arrayOf: {
			allowedTypes: typeArray,
			allowedValues: valueArray
		}
	};
	return nsureRules;
};



Nsure.helpers.mongoidNsure = function(enforce) {
	if (typeof enforce !== 'boolean') {
		enforce = false;
	}
	var nsureRules = {
		defaultTo: minions.randomString(24, true, true, false),
		enforcePresence: enforce,
		checks: [ 'mongoId' ],
		mongoId: {
			onFail: [ 'returnError' ], 
			error: {
				code: 'noMongoId',
				msg: 'must be a mongodb objectId.'
			}
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
