

global.vwsConfig = require(process.argv[2]);
global.fs = require('fs');
var stringify = require('json-stringify-safe');
var server = require('vws');





server.start(
	{},
	function(srv) {
		// --- LANGUAGE
		lang(process.cwd() + '/language.js');
		// --- PAGES
		pages(process.cwd() + '/pages.js')
		// --- AUTH
		// --- READY
		log.add('WE ARE SERVING ----------------------------------- @ ' + assembleRealm(), 'cyan', 'dp', 3);
	}
);




// ----------------[[[ LANGUAGE .. move language to files or DB or both ? make this a vws plugin!
function lang(languageFile) {
	vws.data.languages = require(languageFile);
	minions.returnFileOnUpdate(
		languageFile,
		function(newContent) {
			vws.data.languages = require(languageFile);
			vws.data.lang = getLanguage('en');
		},
		2000
	);
	vws.data.lang = getLanguage('en');
	return vws.data.languages;
};
function getLanguage(langSelector) {
	return vws.data.languages[langSelector];
};



// ----------------[[[ PAGES .. make this a vws plugin!
function pages(pageSettingsFile) {
	vws.data.pages = require(pageSettingsFile);
	minions.returnFileOnUpdate(
		pageSettingsFile,
		function(newContent) {
			vws.data.pages = require(pageSettingsFile);
			return servePages(vws.data.pages);
		},
		2000
	);
	return servePages(vws.data.pages);
};
function servePages(config) {
	for (var i in config) {
		generatePage(config[i]);
	};
};

function generatePage(pageSettings) {
	if (typeof pageSettings.handler === 'function') {
		var handlers = [ ];
		if (pageSettings.ensureAuthenticated === true) {
			handlers.push(ensureAuthenticated);
		}
		handlers.push(pageSettings.handler);
		vws.router.setRoute(
			pageSettings.routes,
			handlers
		);
		console.log('[%s] served via handler.', pageSettings.routes);
		return;
	}
	if (typeof pageSettings.redirect === 'string') {
		vws.router.setRoute(
			pageSettings.routes,
			function(req, res, next) {
				return res.redirect(pageSettings.redirect);
			}
		);
		console.log('[%s] served via redirect.', pageSettings.routes);
		return;
	}
	console.log('[%s] served via template.', pageSettings.routes);
	var pageHandler = function(req, res, next) {
		var data = minions.extendDeep(false, {}, [ pageSettings.baseTemplate.data, pageSettings.subTemplate.data ]);
		if (typeof vws.templates[pageSettings.baseTemplate.templateName] === 'undefined') {
			vws.templates.add(pageSettings.baseTemplate.templateName, pageSettings.baseTemplate.templateFile);
		}
		if (typeof vws.templates[pageSettings.subTemplate.templateName] === 'undefined') {
			vws.templates.add(pageSettings.subTemplate.templateName, pageSettings.subTemplate.templateFile);
		}
		serveTemplate(req, res, pageSettings.baseTemplate.templateName, pageSettings.subTemplate.templateName, data, pageSettings.pagecode)
	};
	var handlers = [ ];
	if (pageSettings.ensureAuthenticated === true) {
		handlers.push(ensureAuthenticated);
	}
	handlers.push(pageHandler);
	return vws.router.setRoute(
		pageSettings.routes,
		handlers
	);
};



function serveTemplate(req, res, templateId, subTemplateId, data, pagecode) {
	pagecode = (pagecode || 200);
	log.add('SERVING ----------------------------------- @ ' + req.url , 'green', 'dp', 3);
	var user = (typeof req.session.user === 'object') ? req.session.user : { _id: 0 };
		
	var renderData = {
		googleAnalyticsId: '', 
		lang: vws.data.lang, 
		user: user,
		pageName: 'home',
		oneRandomOf: oneRandomOf
	};
	minions.extendDeep(false, renderData, data);
	var subTemplateName = subTemplateId; 
	var subtemplate = vws.templates.render(
		subTemplateName, 
		renderData
	);	
	renderData.subtemplate = subtemplate;
	var output = vws.templates.render(
		templateId, 
		renderData
	);				
	res.writeHead(pagecode, {"Content-Type": "text/html", 'Cache-Control': 'public, max-age=0'});
	res.write(output);
	return res.end();
};



// ---[[[ helpers .. move to minions?

function assembleRealm() {
	var realm = vws.config.webserver.domain;
	var protocol = (typeof vws.config.webserver.httpsPort === 'number') ? 'https://' : 'http://'; 
	var port = (typeof vws.config.webserver.httpsPort === 'number') ? vws.config.webserver.httpsPort : vws.config.webserver.httpPort;
	realm = protocol + realm + ':' + port;
	return realm;
};


function oneRandomOf(items) {
	return items[Math.floor(Math.random()*items.length)];	
};