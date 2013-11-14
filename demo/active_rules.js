module.exports = {
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
	},
	onUnruledAttributes: [ 'deleteAttribute' ],
	onError: 'returnErrorMsg'
};