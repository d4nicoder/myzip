const MyZip = require('./index.js')

new MyZip()
	.exclude('node_modules')
	.add(__dirname, '')
	.save('out.zip')		// Returns a promise, so you can use async/await
		.then(() => {
			console.log('Success!')
		})
		.catch(e => {
			console.error(e)
		})