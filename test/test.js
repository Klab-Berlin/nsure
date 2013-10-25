var mongodb = require('mongodb');
var ObjectID = mongodb.ObjectID;
var nsure = require ('../lib/nsure');
var should = require('should');



// ---------------------------

var testObject = {
  userIds: [ 'abc' ],
  level: 2,
	a : '1',
	b : '1234567890',
	c : [ 1, 2 ],
	d: '',
	e: 'fun',
	f: '520cd7a076b1d01478000003',
	timestamp: 1234567890,
	o: {
		o_a: 1,
		o_b: 'a string',
		o_c: {
			o_c_1: 7331
		}
	}
};


var rules = {
	attributesToCheck: {
    level: {
        checks: ['type', 'numberRange'],
        type: {
          expected: 'number',
          onFail: [ 'toInt' ],
          fallback: function(input, options, fullInput, fullRules) { console.log('Error detected in "level"! "level" must be a number!'); return fullInput.level; }
        },
        numberRange: {
          min: 1,
          max: 13,
          onFail: [ 'toBorder' ]
        }
      },
		a: {
			checks: [ 'type', 'numberRange' ],
			type: {
				expected: 'number',
				onFail: [ 'toInt' ],
				fallback: 0
			},
			numberRange: { 
				min: 2,
				max: 1000,
				onFail: [ 'toBorder' ]
			}
		},
		b: {
			checks: [ 'type', 'stringMaxLength' ],
			type: {
				expected: 'string',
				onFail: [ 'toFallback' ],
				fallback: ''
			},
			stringMaxLength: {
				max: 8,
				onFail: [ 'cut' ]
			}
		},
		d: {
			checks: [ 'mongoId' ],
			mongoId: {
				onFail: [ 'toFallback' ],
				fallback: new ObjectID()
			}
		},
		f: {
			checks: [ 'regEx' ],
			regEx: {
				method: 'test',
				//method: 'execute',
				//executeReturn: 0,
				expression: '^[0-9a-fA-F]{24}$',
				flags: 'gi',
				onFail: [ 'returnError' ],
				error: {
					code: 'test.f',
					msg: '[f] should be a String of 24 chars.'
				}
			}
		},
		timestamp: {
			checks: [ 'type' ],
			type: {
				expected: 'number',
				onFail: [ 'toInt' ],
				toInt: {
					onFail: [ 'returnError' ],
					error: {
						code: 'timestamp',
						msg: 'timestamp must be a number.'
					}
				},
				fallback: function(val) {
					var error = new aError('timestamp', 'timestamp must be a number.', val);
					return error;
				}
			}
		}, 
		o: {
			checks: [ 'type', 'subNsure' ],
			type: {
				expected: 'object',
				onFail: [ 'returnError' ],
				error: {
					code: 'noObject',
					msg: 'o must be a object.'
				}
			},
			subNsure: {
				attributesToCheck: {
					o_a: {
						checks: [ 'type' ],
						type: {
							expected: 'number',
							onFail: [ 'returnError' ],
							error: {
								code: 'noNumber',
								msg: 'o.o_a must be a number.'
							}
						}
					},
					o_c: {
						checks: [ 'type', 'subNsure' ],
						type: {
							expected: 'object',
							onFail: [ 'returnError' ],
							error: {
								code: 'noObject',
								msg: 'o.o_c must be a object.'
							}
						},
						subNsure: {
							attributesToCheck: {
								o_c_1: {
									checks: [ 'type' ],
									type: {
										expected: 'number',
										onFail: [ 'returnError' ],
										error: {
											code: 'noNumber',
											msg: 'o.o_c.o_c_1 must be a number.'
										}
									}
								}
							}
						}
					}
				},
				onUnruledAttributes: [ 'deleteAttribute' ],
				onError: 'returnErrorMsg'
			}
		}
	},
	onUnruledAttributes: [ 'deleteAttribute' ],
	onError: 'returnErrorMsg'
};
 
var testEnsure = new nsure(rules);
var result = testEnsure.check(testObject);
var helpers = {};

describe(
	'create a Ensure Ruleset',
	function() {
		it(
			'should return something', 
			function(done) {
				helpers.nsure = new nsure(rules);
				done();
			}
		);
	}
);


describe(
	'check if a model is generated',
	function() {
		it(
			'should have the o.o_c.o_c_1 property and it should be a number', 
			function(done) {
				helpers.nsure.model.o.o_c.o_c_1.should.be.a.number;
				done();
			}
		);
	}
);


describe(
	'check for nsure.check completing',
	function() {
		it(
			'should perform the nsure checks',
			function(done) {
				helpers.checkResult = helpers.nsure.check(testObject);
				helpers.checkResult.should.be.a.object;
				done();
			}
		);
	}
);


describe(
	'check for successful deep Number checks',
	function() {
		it(
			'should return something', 
			function(done) {
				helpers.checkResult.o.o_a.should.be.a.number;
				helpers.checkResult.o.o_a.should.equal(1);
				done();
			}
		);
	}
);
