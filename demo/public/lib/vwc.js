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
		email: {
			rules: {
				attributesToCheck: {
					email: {			
						enforcePresence: true,
						defaultTo: 'defaultEmail@itsatony.com',
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
					}
				}
			},
			data: { email: 'bla @blub,de' }
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
		}
	}
};






jQuery(document).ready(
	function() {
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
		var result = thisNsure.check(data);
		vwc.activeNsure.result = result;
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
