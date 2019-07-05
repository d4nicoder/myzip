# MyZip

Simple zip library to compress files and folders.

#### Dependencies
- jszip v^3.2.2

#### Usage
```javascript
const MyZip = require('myzip')

new MyZip()
	.exclude('node_modules')
	.add('<path_to_folder>')
	.add('<path_to_file>', 'folder/inside/zip')
	.save('destination.zip')
		.then(() => {
			console.log('Success!!')
		})
		.catch(e => {
			console.error(e)
		})
```
Pleas report any problem or issue in the issues section.

#### TODO
- Method to uncompress files