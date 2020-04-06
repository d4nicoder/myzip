import JSZip from 'jszip'
import fs from 'fs'
import path from 'path'
import { ServerResponse } from "http"

interface ISource {
  source: string
  destination: string
}

export default class MyZip {
  private zip: JSZip
  private excludes: (string|RegExp)[] = []
  private sources: ISource[] = []
  private exit: boolean = false
  private customFilter: (itemPath: string) => boolean | Promise<boolean> = () => true

  constructor () {
    this.zip = new JSZip()
    return this
  }

  /**
	 * Define new exclusion
	 * @param {String | RegExp} pattern String or RegExp to exclude
	 */
  public exclude (pattern: string | RegExp): MyZip {
    this.excludes.push(pattern)
    return this
  }

  /**
   * Function to evaluate if the source file has to be included in the zip or not
   * @param func Function tha returns a Boolean or a Promise<boolean>
   */
  public filter (func: (itemPath: string) => boolean | Promise<boolean>) {
    this.customFilter = func
  }

  /**
	 * Add some file or directory to the zip file
	 * @param {String} source Source file or directory to add
	 * @param {String} destination Destination folder inside zip file (optional)
	 */
  public add (source: string, destination: string): MyZip {
    this.sources.push({
      destination,
      source,
    })
    return this
  }

  public exitOnError (value: boolean): MyZip {
    this.exit = value
    return this
  }

  /**
	 * Save the zip file to the destination
	 * @param {String} destination Destination path to save the zip
	 */
  public async save (destination: string): Promise<void> {
    return new Promise(async (resolve, reject) => {

      try {
        await this._processAll()
      } catch (e) {
        if (this.exit) {
          reject(e)
          return
        }
        console.error(e)
      }

      const ws = fs.createWriteStream(destination)
			this.zip.generateNodeStream({streamFiles: true})
				.pipe(ws)
				.on('finish', () => {
					resolve()
				})
				.on('error', (err: Error) => {
					reject(err)
        })
    })
  }

  /**
	 * Stream the zip file to a response object
	 * @param {Response} res Response object
	 * @param {String} name Name of the file to download (optional)
	 */
  public async pipe(res: ServerResponse, name: string): Promise<void> {
    try {
      await this._processAll()
    } catch (e) {
      if (this.exit) {
        throw e
      }
      console.error(e)
    }

    name = (typeof name !== 'string') ? 'out.zip' : name
    try {
      res.setHeader('Content-Disposition', `attachment; filename="${name}"`)
    } catch (e) {
      throw e
    }

    this.zip.generateNodeStream({
      compression: 'DEFLATE',
      type: 'nodebuffer',
    }).pipe(res)
  }

  /**
	 * Extracts a zip file on destination folder
	 * @param {String} source Path of the zip file to extract
	 * @param {String} destination Path of destination
	 */
  public async extract (source: string, destination: string): Promise<void> {
    // Only absolute paths on destination
    if (!path.isAbsolute(destination)) {
      throw new Error('Absolute path for destination required')
    }

    const buf = await fs.promises.readFile(source)
    const zip = await JSZip.loadAsync(buf, {checkCRC32: true})

    const files = Array.from(Object.values(zip.files)).map((file) => {
      return {
        dir: file.dir,
        name: file.name,
      }
    })

    for (let i = 0; i < files.length; i++) {
      const {name, dir} = files[i]
      const buffer = await zip.files[name].async('nodebuffer')
      
      const dst = path.join(destination, name)
      if (dir) {
        await this._ensureDir(dst)
      } else {
        await fs.promises.writeFile(dst, buffer)
      }
    }
  }

  /**
	 * Add file or folder to the zip object
	 * @param {String} source Path to the source file or directory
	 * @param {String} destination Path to the root folder inside the zip
	 */
  private async _add (source: string, destination: string): Promise<void> {
    destination = typeof destination === 'string' ? destination : ''

    if (this.customFilter instanceof Promise) {
      const valid = await this.customFilter(source)
      if (!valid) {
        return
      }
    } else if (typeof this.customFilter === 'function') {
      if (!this.customFilter(source)) {
        return
      }
    }
    for (let i = 0; i < this.excludes.length; i++) {
      const exclude = this.excludes[i]
      if (typeof exclude === 'string') {
        if (exclude === path.basename(source)) {
          return
        }
      } else if (typeof exclude.test !== 'undefined') {
        if (exclude.test(path.basename(source))) {
          return
        }
      }
    }

    // Check file or directory
    const stat = await fs.promises.stat(source)

    if (stat.isFile()) {
      await this._add(source, destination)
    } else if (stat.isDirectory()) {
      let dst
			if (source.slice(-1) === '/') {
				dst = destination
			} else {
				dst = destination + '/' + path.basename(source)
      }
      
      await this._addDir(source, dst)
    } else {
      throw new Error('The path is neither a directory nor a file')
    }
  }

  /**
	 * Stores all files into the ZipObject
	 */
  private async _processAll (): Promise<void> {
    for (let i = 0; i < this.sources.length; i++) {
      try {
        await this._add(this.sources[i].source, this.sources[i].destination)
      } catch (e) {
        if (this.exit) {
          throw e
        }
        console.error(e)
      }
    }
  }

  /**
	 * Add file to the zip object
	 * @param {String} source Source path file
	 * @param {String} destination Path to the destination inside zip
	 */
  private async _addFile (source: string, destination: string): Promise<void> {
    const filename = path.basename(source)
    const destinationFolder = typeof destination === 'string' ?destination + '/' + filename : filename

    const readBuffer = fs.createReadStream(source)
    this.zip.file(destinationFolder, readBuffer, {
      base64: false,
      binary: true,
    })
  }

  /**
	 * Add dir and his content to the zip file
	 * @param {String} source Path to the source directory
	 * @param {String} destination Path to the destination folder inside zip
	 */
  private async _addDir (source: string, destination: string): Promise<void> {
    const files = await fs.promises.readdir(source)

    for (let i = 0; i < files.length; i++) {
      try {
        await this.add(path.join(source, files[i]), destination)
      } catch (e) {
        if (this.exit) {
          throw e
        }
        console.error(e)
      }
    }
  }

  /**
	 * Creates if not exists all folders of the path
	 * @param {String} dir Path of the dir
	 */
  private async _ensureDir (dirPath: string): Promise<void> {
    const fullPath: string[] = []
    const dir = dirPath.split(path.sep)

    for (let i = 0; i < dir.length; i++) {
      let exists = true
      if (dir[i] === '') {
        continue
      }

      fullPath.push(dir[i])
      const actualDir = path.sep + fullPath.join(path.sep)
      let stat
      try {
        stat = await fs.promises.stat(actualDir)
      } catch (e) {
        exists = false
      }

      if (stat && exists && stat.isDirectory()) {
        continue
      }

      try {
        await fs.promises.mkdir('/' + actualDir)
      } catch (e) {
        throw e
      }
    }
  }
}