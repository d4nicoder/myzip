import fs from 'fs'
import MyZip from '../'
import path from 'path'

afterAll(async () => {
  const sampleZip = path.join(__dirname, 'sample.zip')
  const sampleExtracted = path.join(__dirname, 'extracted', 'sample.txt')
  const sampleFolder = path.join(__dirname, 'extracted')
  try {
    await fs.promises.unlink(sampleZip)
  } catch (e) {
    // Nothing
  }

  try {
    await fs.promises.unlink(sampleExtracted)
  } catch (e) {
    // Nothing
  }

  try {
    await fs.promises.rmdir(sampleFolder, {recursive: true})
  } catch (e) {
    // Nothing
  }
})

describe('MyZip', () => {
  it('should zip file to destination', async () => {
    const zip = new MyZip()
    zip.add(path.join(__dirname, 'sample.txt'), '')
    await zip.save(path.join(__dirname, 'sample.zip'))

    let stat
    try {
      stat = await fs.promises.stat(path.join(__dirname, 'sample.zip'))
    } catch (e) {
      // Nothing
      throw e
    }
    expect(stat.isFile()).toBe(true)
  })

  it('should unzip file to destination', async () => {
    const zipFile = path.join(__dirname, 'sample.zip')
    const sampleFile = path.join(__dirname, 'sample.txt')
    const destination = path.join(__dirname, 'extracted')

    const zip = new MyZip()
    zip.add(sampleFile, '')
    await zip.save(zipFile)

    let stat
    try {
      stat = await fs.promises.stat(zipFile)
    } catch (e) {
      // Nothing
      throw e
    }

    const zip2 = new MyZip()
    await zip2.extract(zipFile, destination)

    let stat2
    try {
      stat2 = await fs.promises.stat(path.join(destination, 'sample.txt'))
    } catch (e) {
      // Nothing
      throw e
    }

    expect(stat2.isFile()).toBe(true)
  })
  
})