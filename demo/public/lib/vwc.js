vwc = {
	demos: {
		active: {
			rules: "{\n  attributesToCheck: {\n    active: {\n      enforcePresence: true,\n      defaultTo: true,\n      checks: [ 'type' ],\n      type: {\n        expected: 'boolean',\n        onFail: 'defaultTo'\n      }\n    },\n  },\n  onUnruledAttributes: [ 'deleteAttribute' ],\n  onError: 'returnErrorMsg'\n};\n",
			data: "{\n     active: 1\n};\n"
		}
	}
};

jQuery(document).ready(
	function() {
		jQuery('#navi_run').click(runNsure);
		rulesCodeMirror = new CodeMirror.fromTextArea(
			document.getElementById('nsure_codemirror_rules'),
			{
				mode:  "javascript",
				tabSize: 2,
				lineNumbers: true
			}
		);
		rulesCodeMirror.setSize('32em', '20em');
		rulesCodeMirror.doc.setValue(vwc.demos.active.rules);
		
		dataCodeMirror = CodeMirror.fromTextArea(
			document.getElementById('nsure_codemirror_data'),
			{
				mode:  "javascript",
				tabSize: 2,
				lineNumbers: true
			}
		);
		dataCodeMirror.setSize('25em', '20em');
		dataCodeMirror.doc.setValue(vwc.demos.active.data);
		
		resultsCodeMirror = CodeMirror.fromTextArea(
			document.getElementById('nsure_codemirror_results'),
			{
				mode:  "javascript",
				tabSize: 2,
				lineNumbers: true
			}
		);
		resultsCodeMirror.setSize('24em', '20em');
	
		rulesCodeMirror.doc.on(
			'change', 
			autoUpdate
		);
		dataCodeMirror.doc.on(
			'change', 
			autoUpdate
		);
		
		autoUpdate();
	}
	
);


function autoUpdate() {
	clearTimeout(vwc.autoUpdateTimeout);
	return vwc.autoUpdateTimeout = setTimeout(runNsure, 600);
};

function runNsure() {
	var rulesString = rulesCodeMirror.doc.getValue();
	try {
		var rules = eval(";(function() { var a = " + rulesString + '; return a;}());');
	} catch(err) {
		return showStatus('error', 'rules', err);
	}
	var dataString = dataCodeMirror.doc.getValue();
	try {
		var data = eval(";(function() { var a = " + dataString + '; return a;}());');
	} catch(err) {
		return showStatus('error', 'data', err);
	}
	var thisNsure = new Nsure(rules);
	try {
		var result = thisNsure.check(data);
	} catch (err) {
		return showStatus('error', 'nsure', err);
	}
	try {
		var resultString = JSON.stringify(result);
	} catch (err) {
		return showStatus('error', 'result', err);
	}
	try {
		blink('#nsure_block_results');
		resultsCodeMirror.doc.setValue(resultString);
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
		return jQuery('#nsure_span_status').html('[' + mode + '@' + step + '] > ' + content.message);
	};
	this.success = function(step, content) {
		return jQuery('#nsure_span_status').html('[' + mode + '] > ' + content.message);
	};
	jQuery('#nsure_span_status').fadeIn();
	return this[mode](step, content);	
};