[![build status](https://secure.travis-ci.org/itsatony/nsure.png)](http://travis-ci.org/itsatony/nsure)

# nsure

[nsure] is a nodejs class that allows deep testing, modification chains and model generation of objects

The goal here was to have a simple, yet highly flexible cheking system for variables

This project is still in very early development, hence anything is subject to change!


* installing

````
    npm install nsure
````

* a simple example

this is a series of checks and modifications to make sure (nsure ;) ) that a string is a valid email

````
		var nsure = require('nsure');
    var nsureRules_user_email = {
			defaultTo: function() {
				return 'defaultEmail@itsatony.com';
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
		var emailCheck = new nsure(nsureRules_user_email);
		emailCheck('bla @blub');
````

* helpers for shortening your checks

````
	var helpDemoRuleSet = {
		'attributesToCheck': {
			'gender': Nsure.helpers.inListNsure(['m', 'f']),
			'height': Nsure.helpers.numberNsure(100, 290, 180),
			'tld': Nsure.helpers.stringNsure(4, '.com'),
			'url': Nsure.helpers.urlNsure(400, 'http://google.com'),
			'email': Nsure.helpers.emailNsure(),
			'protocols': Nsure.helpers.arrayOfNsure(['string', ['http', 'ftp', 'https' ], ['http'])
		},
		onUnruledAttributes: [ 'deleteAttribute' ],
		onError: 'returnErrorMsg'
	};
	var testObject = {
	};
	var testEnsure = new Nsure(helpDemoRuleSet);
	console.log(testObject);
	console.log('single attribute check ---');
	var result = testEnsure.check(testObject, [ 'gender' ]);
	console.log(result);
	console.log('full attribute check ---');
	var result = testEnsure.check(testObject);
	console.log(result);
	console.log('---MODEL---');
	console.log(testEnsure.model);
	console.log('---=====---'); 
		
````


* getting a model from a more complex check

Here a complex object is defined, then a ruleset is defined and a nsure generated for it. the object is passed through and the result is modified appropriately.
Also, whenever a nsure is instanced using a ruleset, it will generate a model based on that set of rules, which is available via  .model

````
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
		
		var testEnsure = new nsureField(rules);
		console.log(testObject);
		var result = testEnsure.check(testObject);
		console.log(result);
		console.log('---MODEL---');
		console.log(testEnsure.model);
		console.log('---=====---'); */
		
````


* 

    - 
````
		var a = 1;
		
````
    - get everything
````
		var a = 1;
		
````




# VERSION

v 0.2.27


# author

Toni Wagner


# Licence

free
