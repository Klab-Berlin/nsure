// ----------------[[[ pages
var pages = {
	'index': {
		redirect: '/home',
		ensureAuthenticated: false,
		pageCode: 404,
		routes: [ '^\/$', '^\/index.html$', '/^tst$' ]
	},
	'404': {
		baseTemplate: {
			templateName: 'index',
			templateFile: process.cwd() + '/html/index.html',
			data: {
			}
		},
		subTemplate: {
			templateName: 'subtemplate_404',
			templateFile: process.cwd() + '/html/subtemplate_404.html',
			data: {
				pageName: 'user'
			}
		},
		ensureAuthenticated: false,
		pageCode: 404,
		routes: [ '^\/404(\/|$)' ]
	},
	'home': {
		baseTemplate: {
			templateName: 'index',
			templateFile: process.cwd() + '/html/index.html',
			data: {
			}
		},
		subTemplate: {
			templateName: 'subtemplate_home',
			templateFile: process.cwd() + '/html/subtemplate_home.html',
			data: {
				pageName: 'home'
			}
		},
		ensureAuthenticated: false,
		pageCode: 200,
		routes: [ '^\/home(\/|$)' ]
	},
	'debugRequest': {
		handler: function(req, res, next) {
			return res.end(stringify(req));	
		},
		ensureAuthenticated: false,
		pageCode: 200,
		routes: [ '^\/debug\/request(\/|$)' ]
	},
};

module.exports = pages;