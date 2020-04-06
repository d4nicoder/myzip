"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jszip_1 = __importDefault(require("jszip"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class MyZip {
    constructor() {
        this.excludes = [];
        this.sources = [];
        this.exit = false;
        this.customFilter = () => true;
        this.zip = new jszip_1.default();
        return this;
    }
    /**
       * Define new exclusion
       * @param {String | RegExp} pattern String or RegExp to exclude
       */
    exclude(pattern) {
        this.excludes.push(pattern);
        return this;
    }
    /**
     * Function to evaluate if the source file has to be included in the zip or not
     * @param func Function tha returns a Boolean or a Promise<boolean>
     */
    filter(func) {
        this.customFilter = func;
        return this;
    }
    /**
       * Add some file or directory to the zip file
       * @param {String} source Source file or directory to add
       * @param {String} destination Destination folder inside zip file (optional)
       */
    add(source, destination) {
        this.sources.push({
            destination,
            source,
        });
        return this;
    }
    exitOnError(value) {
        this.exit = value;
        return this;
    }
    /**
       * Save the zip file to the destination
       * @param {String} destination Destination path to save the zip
       */
    save(destination) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                try {
                    yield this._processAll();
                }
                catch (e) {
                    if (this.exit) {
                        reject(e);
                        return;
                    }
                    console.error(e);
                }
                const ws = fs_1.default.createWriteStream(destination);
                this.zip.generateNodeStream({ streamFiles: true })
                    .pipe(ws)
                    .on('finish', () => {
                    resolve();
                })
                    .on('error', (err) => {
                    reject(err);
                });
            }));
        });
    }
    /**
       * Stream the zip file to a response object
       * @param {Response} res Response object
       * @param {String} name Name of the file to download (optional)
       */
    pipe(res, name) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this._processAll();
            }
            catch (e) {
                if (this.exit) {
                    throw e;
                }
                console.error(e);
            }
            name = (typeof name !== 'string') ? 'out.zip' : name;
            try {
                res.setHeader('Content-Disposition', `attachment; filename="${name}"`);
            }
            catch (e) {
                throw e;
            }
            this.zip.generateNodeStream({
                compression: 'DEFLATE',
                type: 'nodebuffer',
            }).pipe(res);
        });
    }
    /**
       * Extracts a zip file on destination folder
       * @param {String} source Path of the zip file to extract
       * @param {String} destination Path of destination
       */
    extract(source, destination) {
        return __awaiter(this, void 0, void 0, function* () {
            // Only absolute paths on destination
            if (!path_1.default.isAbsolute(destination)) {
                throw new Error('Absolute path for destination required');
            }
            const buf = yield fs_1.default.promises.readFile(source);
            const zip = yield jszip_1.default.loadAsync(buf, { checkCRC32: true });
            const files = Array.from(Object.values(zip.files)).map((file) => {
                return {
                    dir: file.dir,
                    name: file.name,
                };
            });
            for (let i = 0; i < files.length; i++) {
                const { name, dir } = files[i];
                const buffer = yield zip.files[name].async('nodebuffer');
                const dst = path_1.default.join(destination, name);
                if (dir) {
                    yield this._ensureDir(dst);
                }
                else {
                    yield fs_1.default.promises.writeFile(dst, buffer);
                }
            }
        });
    }
    /**
       * Add file or folder to the zip object
       * @param {String} source Path to the source file or directory
       * @param {String} destination Path to the root folder inside the zip
       */
    _add(source, destination) {
        return __awaiter(this, void 0, void 0, function* () {
            destination = typeof destination === 'string' ? destination : '';
            if (this.customFilter instanceof Promise) {
                const valid = yield this.customFilter(source);
                if (!valid) {
                    return;
                }
            }
            else if (typeof this.customFilter === 'function') {
                if (!this.customFilter(source)) {
                    return;
                }
            }
            for (let i = 0; i < this.excludes.length; i++) {
                const exclude = this.excludes[i];
                if (typeof exclude === 'string') {
                    if (exclude === path_1.default.basename(source)) {
                        return;
                    }
                }
                else if (typeof exclude.test !== 'undefined') {
                    if (exclude.test(path_1.default.basename(source))) {
                        return;
                    }
                }
            }
            // Check file or directory
            const stat = yield fs_1.default.promises.stat(source);
            if (stat.isFile()) {
                yield this._add(source, destination);
            }
            else if (stat.isDirectory()) {
                let dst;
                if (source.slice(-1) === '/') {
                    dst = destination;
                }
                else {
                    dst = destination + '/' + path_1.default.basename(source);
                }
                yield this._addDir(source, dst);
            }
            else {
                throw new Error('The path is neither a directory nor a file');
            }
        });
    }
    /**
       * Stores all files into the ZipObject
       */
    _processAll() {
        return __awaiter(this, void 0, void 0, function* () {
            for (let i = 0; i < this.sources.length; i++) {
                try {
                    yield this._add(this.sources[i].source, this.sources[i].destination);
                }
                catch (e) {
                    if (this.exit) {
                        throw e;
                    }
                    console.error(e);
                }
            }
        });
    }
    /**
       * Add file to the zip object
       * @param {String} source Source path file
       * @param {String} destination Path to the destination inside zip
       */
    _addFile(source, destination) {
        return __awaiter(this, void 0, void 0, function* () {
            const filename = path_1.default.basename(source);
            const destinationFolder = typeof destination === 'string' ? destination + '/' + filename : filename;
            const readBuffer = fs_1.default.createReadStream(source);
            this.zip.file(destinationFolder, readBuffer, {
                base64: false,
                binary: true,
            });
        });
    }
    /**
       * Add dir and his content to the zip file
       * @param {String} source Path to the source directory
       * @param {String} destination Path to the destination folder inside zip
       */
    _addDir(source, destination) {
        return __awaiter(this, void 0, void 0, function* () {
            const files = yield fs_1.default.promises.readdir(source);
            for (let i = 0; i < files.length; i++) {
                try {
                    yield this.add(path_1.default.join(source, files[i]), destination);
                }
                catch (e) {
                    if (this.exit) {
                        throw e;
                    }
                    console.error(e);
                }
            }
        });
    }
    /**
       * Creates if not exists all folders of the path
       * @param {String} dir Path of the dir
       */
    _ensureDir(dirPath) {
        return __awaiter(this, void 0, void 0, function* () {
            const fullPath = [];
            const dir = dirPath.split(path_1.default.sep);
            for (let i = 0; i < dir.length; i++) {
                let exists = true;
                if (dir[i] === '') {
                    continue;
                }
                fullPath.push(dir[i]);
                const actualDir = path_1.default.sep + fullPath.join(path_1.default.sep);
                let stat;
                try {
                    stat = yield fs_1.default.promises.stat(actualDir);
                }
                catch (e) {
                    exists = false;
                }
                if (stat && exists && stat.isDirectory()) {
                    continue;
                }
                try {
                    yield fs_1.default.promises.mkdir('/' + actualDir);
                }
                catch (e) {
                    throw e;
                }
            }
        });
    }
}
exports.default = MyZip;
//# sourceMappingURL=index.js.map