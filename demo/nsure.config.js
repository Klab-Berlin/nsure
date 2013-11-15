var baseDir = process.cwd();
var config = {
	// ------- [[[ basics
	id: 'nsure',
	baseDir: baseDir,
	replPort: 9996,
	debug: true,
	// ------- [[[ bubPubSub
	pubSubaseDirebugging: 0,
	// ------- [[[ plugins
	activePlugins: [
		// 'vwsPlugin.ngether',
		'vwsPlugin.replHelp',
		'vwsPlugin.callExecutor',
		'vwsPlugin.router',
		'vwsPlugin.comm',
		'vwsPlugin.templates',
		'vwsPlugin.userAgent',
		'vwsPlugin.geoIp',
		'vwsPlugin.mongodbWrapper',
		// 'vwsPlugin.websocketServer',
		'vwsPlugin.resourceController',
		// 'vwsPlugin.mail',
		'vwsPlugin.api',
		'vwsPlugin.api.layer.auth',
		'vwsPlugin.api.layer.allow',
		'vwsPlugin.api.layer.logic',
		'vwsPlugin.api.layer.action',
		'vwsPlugin.api.layer.answer',
		'vwsPlugin.api.layer.propagate',
		'vwsPlugin.oauth',
	],
	// ------- [[[ router
	router: {
		//noRouteAction: 
	},
	connectMiddleware: [
	],
	// ------- [[[ routing calls
	preRoutingCalls: {
		userAgent: function(req, res, next) { return vws.userAgent.get(req, res, next); },
		geoIp: function(req, res, next) { return vws.geoIp.get(req, res, next); }
	},
	// ------- [[[ webserver  --> vwsPlugin.webserver	
	ssl: false,
	webserver: {
		servedDirectories: {
			'public': {
				root: baseDir + '/public'
			}
		},
		domain: 'dev-toni.meinunterricht.de',
		httpPort: 8082,
		httpsPort: false,
		cookies: {
			secret: 'secret!',
			secure: false,
			domain: 'meinunterricht.de',
			path: '/',
			httpOnly: true,
			maxAge: 14400000,
			key: 'nsure.sid'
		}
	},
	// ------- [[[ databases preparation (auto-wrapping) --> vwsPlugin.mongodbWrapper
	mongoDBs: {
		sessions: {
      ip:         '127.0.0.1',
      port:       27017,
			db:         'nsure',
      name:       'nsure',
      collection: 'sessions'
    }
	},
	// ------- [[[ analytics
	googleAnalyticsId: '00-00-00-00-00',
	// ------- [[[ logging by lg
	logger: {
		log2console: true,
		logLevel: 0,
		shortTimeStamp: true
	},
	// ------- [[[ ngether
	ngetherConfig: {
		// --- [[[ basics
		id: 'nsure',
		socketServer: {
			host: '127.0.0.1',
			port: 9888,
		},
		poolIds: [ 'spots', 'nsure', 'webserver' ],
		initiallyConnectTo: {
			/* yoda_t_mu: {
				id: 'yoda_t_mu',
				host: '127.0.0.1',
				port: 6001
			}  */
		},
		replPort: false,
		reconnectInterval: 5000,
		listConnections: false,
		// --- [[[ db preparation (auto-wrapping)
		mongoDBs: {
			
		},
		// --- [[[ logging
		loggingConfig: {
			logLevel: 2,
			meshBubPubSub: 0,
			shortTimeStamp: true,
		},
		// --- [[[ plugins
		activePlugins: [
			'ngetherPlugin.receiveMeshWorkNodes',
			'ngetherPlugin.sendMeshWorkNodes',
			'ngetherPlugin.simpleAuth',
			'ngetherPlugin.mongodb',
			// 'ngetherPlugin.ngetherFS',
			// 'ngetherPlugin.fileTransfer',
			// 'ngetherPlugin.mail',
			//'ngetherPlugin.panicMail',
			'ngetherPlugin.myprocess',
			// 'ngetherPlugin.checkDBconnection',
			'ngetherPlugin.replConvenience',
			//'ngetherPlugin.latency',
			// 'ngetherPlugin.checkHttpResponse',			
		],
		// --- [[[ ngetherPlugin.checkDBconnection
		checkDBSettings: {
			dbsToCheck: [ ]
		},
		// --- [[[ ngetherPlugin.simpleAuth
		authSettings: {
			useWhiteList: false,
			whiteList: [ 'aSpotId' ],
			usePassword: true,
			password: 'ngether',
			useBlackList: false,
			blackList: [ 'aSpotId2' ],
		},
		// --- [[[ ngetherPlugin.mail, ngetherPlugin.panicMail, ...
		mailSettings: {
			mode: 'SMTP',
			auth: {
				service: 'Gmail',
				auth: {
					user: 'something@gmail.com',
					pass: 'anything'
				}
			}
		},
		// --- [[[ ngetherPlugin.myprocess
		myProcess: {
			killKey: 'killMe123'
		},
		// --- [[[ ngetherPlugin.checkHttpResponse
		checkHttpResponse: {
			urlsToCheck: []
		}
	}
};

module.exports = config;
