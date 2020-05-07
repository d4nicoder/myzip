const path = require('path')
const MyZip = require('.').default

const comprirmir = () => {
  new MyZip()
    .extract('out.zip', path.join(__dirname, 'test'))
    .then(() => {
      console.log('Fin')
    })
    .catch((e) => {
      console.error(e)
    })
}

new MyZip()
  .exclude('node_modules')
  .add(__dirname, '')
  .add(path.join(__dirname, 'README.md'), '', 'read-me.md')
  .save('out.zip') // Returns a promise, so you can use async/await
  .then(() => {
    comprirmir()
  })
  .catch((e) => {
    console.error(e)
  })
