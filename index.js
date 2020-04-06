const JSZip = require('jszip')
const fs = require('fs')
const path = require('path')

class MyZip {
	constructor (rutaBase) {
		this.zip = new JSZip()
		this.excludes = []			// Array with exclusion patterns
		this.sources = []			// Array with files and folders to include
		this.exitOnError = false	// Terminate the process on error
	}

	/**
	 * Define new exclusion
	 * @param {String | RegExp} pattern String or RegExp to exclude
	 */
	exclude (pattern) {
		this.excludes.push(pattern)
		return this
	}

	/**
	 * Add some file or directory to the zip file
	 * @param {String} source Source file or directory to add
	 * @param {String} destination Destination folder inside zip file (optional)
	 */
	add (source, destination) {
		this.sources.push({
			source: source,
			destination: destination
		})
		return this
	}

	exitOnError (value) {
		this.exitOnError = (typeof value === 'boolean') ? value : this.exitOnError
		return this
	}

	/**
	 * Save the zip file to the destination
	 * @param {String} destination Destination path to save the zip
	 */
	async save (destination) {
		return new Promise(async (resolve, reject) => {

			try {
				await this._processAll()
			} catch (e) {
				if (this.exitOnError) {
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
				.on('error', err => {
					reject(err)
				})
		})
	}

	/**
	 * Stream the zip file to a response object
	 * @param {Response} res Response object
	 * @param {String} name Name of the file to download (optional)
	 */
	async pipe(res, name) {
		try {
			await this._processAll()
		} catch (e) {
			if (this.exitOnError) {
				reject(e)
				return
			}
			console.error(e)
		}
		name = (typeof name !== 'string') ? 'out.zip' : name
		try {
			res.setHeader('Content-Disposition', 'attachment; filename="' + name +'"')
		} catch (e) {
			throw e
		}
		this.zip.generateNodeStream({
			type: 'nodebuffer',
			compression: 'DEFLATE',
			level: 9
		}).pipe(res)
	}

	/**
	 * Extracts a zip file on destination folder
	 * @param {String} source Path of the zip file to extract
	 * @param {String} destination Path of destination
	 */
	async extract(source, destination) {
		// Only absolute paths on destination!
		if (!path.isAbsolute(destination)) {
			throw(new Error('Absolute path for destination required'))
		}

		let buf
		try {
			buf = fs.promises.readFile(source)
		} catch (e) {
			throw e
		}
		let zip
		try {
			zip = await JSZip.loadAsync(buf, {checkCRC32: true})
		} catch (e) {
			throw e
		}
		const files = Array.from(Object.values(zip.files)).map(f => {
			return {
				name: f.name,
				dir: f.dir
			}
		})

		for (let i = 0; i < files.length; i++) {
			let buffer
			const fileName = files[i].name
			const isDir = files[i].dir
			try {
				buffer = await zip.files[fileName].async('nodebuffer')
			} catch (e) {
				throw e
			}

			let dst
			if (isDir) {
				dst = path.join(destination, fileName)
				try {
					await this._ensureDir(dst)
				} catch (e) {
					throw e
				}
				continue
			} else {
				dst = path.join(destination, fileName)
				try {
					await fs.promises.writeFile(dst, buffer)
				} catch (e) {
					throw e
				}
			}
		}
	}

	/**
	 * Add file or folder to the zip object
	 * @param {String} source Path to the source file or directory
	 * @param {String} destination Path to the root folder inside the zip
	 */
	async _add (source, destination) {
		destination = typeof destination === 'string' ? destination : ''

		for (let i = 0; i < this.excludes.length; i++) {
			if (typeof this.excludes[i] === 'string') {
				if (this.excludes[i] === path.basename(source)) {
					return
				}
			} else if (typeof this.excludes[i].test !== 'undefined') {
				if (this.excludes[i].test(path.basename(source))) {
					return
				}
			}
		}

		// Check, file or directory?
		let stat
		try {
			stat = await fs.promises.stat(source)
		} catch (e) {
			throw e
		}

		if (stat.isFile()) {
			try {
				await this._addFile(source, destination)
			} catch (e) {
				throw e
			}

			return this
		} else if (stat.isDirectory()) {
			let dst
			if (source.slice(-1) === '/') {
				dst = destination
			} else {
				dst = destination + '/' + path.basename(source)
			}
			
			try {
				await this._addDir(source, dst)
			} catch (e) {
				throw e
			}

			return this
		}

		throw new Error('The route is neither a directory nor a file')
	}

	/**
	 * Stores all files into the ZipObject
	 */
	async _processAll () {
		for (let i = 0; i < this.sources.length; i++) {
			try {
				await this._add(this.sources[i].source, this.sources[i].destination)
			} catch (e) {
				if (this.exitOnError) {
					throw e
				}
				console.error(e)
			}
		}
		return true
	}

	/**
	 * Add file to the zip object
	 * @param {String} source Source path file
	 * @param {String} destination Path to the destination inside zip
	 */
	async _addFile(source, destination) {
		const fileName = path.basename(source)
		const destinationFolder = (typeof destination === 'string') ? destination + '/' + fileName : fileName

		const rb = fs.createReadStream(source)
		this.zip.file(destinationFolder, rb, {
			binary: true,
			base64: false
		})
	}

	/**
	 * Add dir and his content to the zip file
	 * @param {String} source Path to the source directory
	 * @param {String} destination Path to the destination folder inside zip
	 */
	async _addDir(source, destination) {
		let files
		try {
			files = await fs.promises.readdir(source)
		} catch (e) {
			throw e
		}

		for (let i = 0; i < files.length; i++) {
			try {
				await this.add(path.join(source, files[i]), destination)
			} catch (e) {
				if (this.exitOnError) {
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
	async _ensureDir (dir) {
		let fullPath = []
		dir = dir.split(path.sep)

		for (let i = 0; i < dir.length; i++) {
			let exists = true
			let stat
			if (dir[i] === '') {
				continue
			}
			fullPath.push(dir[i])
			const actualDir = path.sep + fullPath.join(path.sep)
			try {
				stat = await fs.promises.stat(actualDir)
			} catch (e) {
				exists = false
			}

			if (exists && stat.isDirectory()) {
				continue
			}

			try {
				await fs.promises.mkdir('/' + actualDir)
			} catch (e) {
				throw e
			}
		}

		return true
	}
}

module.exports = MyZip