const MyZip = require('./index.js')
const path = require('path')

new MyZip()
	.exclude('node_modules')
	.add(__dirname, '')
	.save('out.zip')		// Returns a promise, so you can use async/await
		.then(() => {
			comprirmir()
		})
		.catch(e => {
			console.error(e)
		})

const comprirmir = () => {
	new MyZip()
		.extract('out.zip', path.join(__dirname, 'test'))
			.then(() => {
				console.log('Fin')
			})
			.catch(e => {
				console.error(e)
			})
}