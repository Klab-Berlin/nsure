vwc = {
	demos: {
		active: {
			rules: {
				attributesToCheck: {
					active: {
						enforcePresence: true,
						defaultTo: true,
						checks: [ 'type' ],
						type: {
							expected: 'boolean',
							onFail: 'defaultTo'
						}
					},
				}
			},
			data: { active: 1 }
		},
		myDate: {
			rules: {
				"attributesToCheck": {
					"myDate": {
						"defaultTo": Date.now(),
						"enforcePresence": true,
						"checks": [ 'isDefined', 'isDate' ],
						"isDefined": {			
							"fallback": Date.now(),
							"onFail": [ 'toFallback' ],
						},
						"isDate": {
							"fallback": Date.now(),
							"onFail": [ 'toFallback' ],			
						}
					},
				}
			},
			data: { myDate: "bad date" }
		},
		objectContent: {
			rules: {
				"attributesToCheck": {
					"protocols": {
						"enforcePresence": true,
						"defaultTo": {
							"http": false,
							"https": false
						},
						"checks": [
							"isObject",
							"objectOf"
						],
						"isObject": {
							"onFail": [
								"toFallback"
							],
							"fallback": {
								"http": "true"
							}
						},
						"objectOf": {
							"allowedTypes": [
								"boolean"
							],
							"allowedValues": [
								true,
								false
							],
							"allowedKeys": [
								"http",
								"https"
							]
						}
					}
				},
				onUnruledAttributes: [ 'deleteAttribute' ],
				onError: 'returnErrorMsg'
			},
			data: {
				protocols: {
					"http": true,
					"https": true,
					"ftp": true,
					"somethingElse": "hello"
				}
			}
		},
		email: {
			rules: {
				attributesToCheck: {
					email: {			
						enforcePresence: true,
						defaultTo: 'defaultEmail@itsatony.com',
						checks: [ 'type', 'toLowerCase', 'stringMaxLength', 'replace_trim', 'email' ],
						type: {
								expected: 'string',
								onFail: [ 'returnError' ],
								error: {
										code: 'email.format',
										msg: '[email] needs to be valid, >6 chars and <80 chars.'
								}
						},
						toLowerCase: {},
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
					}
				}
			},
			data: { email: 'BLA@blub.de' }
		},
		gender: {
			rules: {
				'attributesToCheck': {
					// short would be: 'gender': Nsure.helpers.inListNsure(['m', 'f'])
					'gender': Nsure.helpers.inListNsure(['m', 'f'])
				}
			},
			data: {
				gender: 'n'
			}
		},
		protocols: {
			rules: {
				'attributesToCheck': {
					// short would be: 'gender': Nsure.helpers.inListNsure(['m', 'f'])
					'protocols': Nsure.helpers.arrayOfNsure(['string'], ['http', 'ftp', 'https' ], ['http'])
				}
			},
			data: {
				protocols: 'http'
			}
		},
		emailArray: {
			rules: {
				'attributesToCheck': {
					'emailList': {
						checks: [ 'type', 'arrayOf' ],
						defaultTo: function() {
							return [];
						},	
						type: {
							expected: 'array',
							onFail: 'defaultTo', 
							error: {
								code: 'noArray',
								msg: 'emailList must be a array.'
							},
							defaultTo: function() { return []; }
						},
						arrayOf: {
							allowedTypes: [ 'string' ],
							onError: 'defaultTo',
							error: {
								code: 'noEmail',
								msg: 'emailList must be a array of email strings.'
							},
							defaultTo: function() { return []; },
							valueCheck: function(input, options, thisAttribute, fullInput, fullRules) {
								var emailRegEx = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
								if (emailRegEx.test(input) === true) { 
									return input; 
								}	else {
									return void 0;
								}
							}
						}
					}
				}
			},
			data: {
				'emailList': [ 'bla', 'i@itsatony.com' ]
			}
		},
		deepChecks: {
			rules: {
				"attributesToCheck": {
					"changed": {
						defaultTo: {
							timestamp: Date.now(),
							userId: '000000000000000000000001'
						},	
						checks: [ 'type', 'subNsure' ],
						type: {
							expected: 'object',
							onFail: [ 'returnError' ], 
							error: {
								code: 'noObject',
								msg: 'changed must be a object.'
							}
						},
						subNsure: {
							attributesToCheck: {
								'timestamp': Nsure.helpers.numberNsure(1380000000000, 1500000000000, Date.now()),
								'userId': {
									checks: [ 'type' ],
									type: {
										expected: 'string',
										onFail: [ 'returnError' ], 
										error: {
											code: 'noString',
											msg: 'userId must be a string.'
										}
									}
								}
							},
							onUnruledAttributes: [ 'deleteAttribute' ],
							onError: 'returnError'
						}
					}
				}
			},
			data: {
				"changed": {
					timestamp: 0,
					userId: 0
				}
			}
		}
	}
};






jQuery(document).ready(
	function() {
		for (var name in vwc.demos) {
			var html = '<div class="examplelink"><a id="navi_' + name + '" data-ref="' + name + '" class="navigationanchor rightanchor" >' + name + '<div class="arrow-right"></div></a></div>'
			jQuery('#nsuresearch_wrapper').append(html);
		}		
		jQuery('.examplelink').click(
			function(e) {
				var ref = jQuery(e.target).attr('data-ref');
				selectDemo(ref);				
			}
		);
		
		rulesCodeMirror = new CodeMirror.fromTextArea(
			document.getElementById('nsure_codemirror_rules'),
			{
				mode: {"name": "javascript", "json": true},
				tabSize: 2,
				lineNumbers: true
			}
		);
		rulesCodeMirror.setSize('36em', '20em');
		
		dataCodeMirror = CodeMirror.fromTextArea(
			document.getElementById('nsure_codemirror_data'),
			{
				mode: {"name": "javascript", "json": true},
				tabSize: 2,
				lineNumbers: true
			}
		);
		dataCodeMirror.setSize('36em', '20em');
		
		modelCodeMirror = CodeMirror.fromTextArea(
			document.getElementById('nsure_codemirror_model'),
			{
				mode: {"name": "javascript", "json": true},
				tabSize: 2,
				lineNumbers: true
			}
		);
		modelCodeMirror.setSize('36em', '20em');
		
		resultsCodeMirror = CodeMirror.fromTextArea(
			document.getElementById('nsure_codemirror_results'),
			{
				mode: {"name": "javascript", "json": true},
				tabSize: 2,
				lineNumbers: true
			}
		);
		resultsCodeMirror.setSize('36em', '20em');
	
		rulesCodeMirror.doc.on(
			'change', 
			autoUpdate
		);
		dataCodeMirror.doc.on(
			'change', 
			autoUpdate
		);
		
		selectDemo('active');
		
		autoUpdate();
	}
	
);


function autoUpdate() {
	clearTimeout(vwc.autoUpdateTimeout);
	return vwc.autoUpdateTimeout = setTimeout(runNsure, 600);
};


function fillRules(ruleString) {
	rulesCodeMirror.doc.setValue(ruleString);
	return updateFormatting(rulesCodeMirror);
};
function fillData(dataString) {
	dataCodeMirror.doc.setValue(dataString);
	return updateFormatting(dataCodeMirror);
};
function selectDemo(name) {
	var ruleString = JSON.stringify(vwc.demos[name].rules);
	fillRules(ruleString);
	var dataString = JSON.stringify(vwc.demos[name].data);
	fillData(dataString);
	return vwc.demos[name];
};

function runNsure() {
	vwc.activeNsure = {};
	var rulesString = rulesCodeMirror.doc.getValue();
	try {
		var rules = eval(";(function() { var a = " + rulesString + '; return a;}());');
		vwc.activeNsure.rules = rules;
	} catch(err) {
		return showStatus('error', 'rules', err);
	}
	var dataString = dataCodeMirror.doc.getValue();
	try {
		var data = eval(";(function() { var a = " + dataString + '; return a;}());');
		vwc.activeNsure.data = data;
	} catch(err) {
		return showStatus('error', 'data', err);
	}
	var thisNsure = new Nsure(rules);
	try {
		var result = thisNsure.check(data, [], true);
		vwc.activeNsure.result = result;
		console.log(data, result);
	} catch (err) {
		return showStatus('error', 'nsure', err);
	}
	try {
		var resultString = (typeof result === 'object') ? JSON.stringify(result) : result;
	} catch (err) {
		return showStatus('error', 'result', err);
	}
	try {
		var modelString = JSON.stringify(thisNsure.model);
		vwc.activeNsure.model = thisNsure.model;
	} catch (err) {
		return showStatus('error', 'model', err);
	}
	try {
		blink('#nsure_block_results');
		blink('#nsure_block_model');
		resultsCodeMirror.doc.setValue(resultString);
		if (typeof result === 'object') {
			updateFormatting(resultsCodeMirror);
		}
		modelCodeMirror.doc.setValue(modelString);
		updateFormatting(modelCodeMirror);
	} catch (err) {
		return showStatus('error', 'result', err);
	}
	return showStatus('success', 'nsure', { message: 'nsured!' });
};


function blink(selector) {
	jQuery(selector).addClass('blink_me');
	return setTimeout(function() { jQuery(selector).removeClass('blink_me'); }, 500);
};


function showStatus(mode, step, content) {
	// console.error(content);
	jQuery('#nsure_span_status').fadeOut('fast');
	jQuery('#nsure_span_status').removeClass();
	jQuery('#nsure_span_status').addClass('statusClass_' + mode);
	this.error = function(step, err) {
		resultsCodeMirror.doc.setValue('');
		modelCodeMirror.doc.setValue('');
		return jQuery('#nsure_span_status').html('[' + mode + '@' + step + '] > ' + content.message);
	};
	this.success = function(step, content) {
		return jQuery('#nsure_span_status').html('[' + mode + '] > ' + content.message);
	};
	jQuery('#nsure_span_status').fadeIn();
	return this[mode](step, content);	
};


function updateFormatting(editor) {
	selectAll(editor);
	autoFormatSelection(editor);
};

function selectAll(editor) {
	CodeMirror.commands["selectAll"](editor);
};

function getSelectedRange(editor) {
	return { from: editor.getCursor(true), to: editor.getCursor(false) };
};

function autoFormatSelection(editor) {
	var range = getSelectedRange(editor);
	var formatted_json = jsl.format.formatJson(editor.doc.getValue());
	editor.doc.setValue(formatted_json);
};
