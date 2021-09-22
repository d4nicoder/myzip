# MyZip

Simple zip library to compress and extract files and folders.

#### Dependencies

- jszip v^3.6.0

#### Usage to generate zip

```javascript
const MyZip = require('myzip')

new MyZip()
 .exclude('node_modules')
 .add('<path_to_folder>') // Absolute path
 .add('<path_to_file>', 'folder/inside/zip')
 .add('<path_to_file>', 'folder/inside/zip', 'newFilename')
  .filter((source) => {
    if (source === 'myExcludedDir') {
      return false
    }
    return true
  })
 .save('destination.zip')
  .then(() => {
   console.log('Success!!')
  })
  .catch(e => {
   console.error(e)
  })
```

**Note**: If the folder to add ends with slash '/' it will add all the content without create that folder inside the zip

#### Usage to extract zip

```javascript
const MyZip = require('myzip')

new MyZip()
 .extract('source.zip', 'destination/folder') // Absolute path on destination folder
  .then(() => {
   console.log('Success!!')
  })
  .catch(e => {
   console.error(e)
  })
```

Please report any problem or issue in the issues section.
If you think that this package is a little bit util, leave me a star ;)
