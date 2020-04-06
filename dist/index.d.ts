/// <reference types="node" />
import { ServerResponse } from "http";
export default class MyZip {
    private zip;
    private excludes;
    private sources;
    private exit;
    private customFilter;
    constructor();
    /**
       * Define new exclusion
       * @param {String | RegExp} pattern String or RegExp to exclude
       */
    exclude(pattern: string | RegExp): MyZip;
    /**
     * Function to evaluate if the source file has to be included in the zip or not
     * @param func Function tha returns a Boolean or a Promise<boolean>
     */
    filter(func: (itemPath: string) => boolean | Promise<boolean>): MyZip;
    /**
       * Add some file or directory to the zip file
       * @param {String} source Source file or directory to add
       * @param {String} destination Destination folder inside zip file (optional)
       */
    add(source: string, destination: string): MyZip;
    exitOnError(value: boolean): MyZip;
    /**
       * Save the zip file to the destination
       * @param {String} destination Destination path to save the zip
       */
    save(destination: string): Promise<void>;
    /**
       * Stream the zip file to a response object
       * @param {Response} res Response object
       * @param {String} name Name of the file to download (optional)
       */
    pipe(res: ServerResponse, name: string): Promise<void>;
    /**
       * Extracts a zip file on destination folder
       * @param {String} source Path of the zip file to extract
       * @param {String} destination Path of destination
       */
    extract(source: string, destination: string): Promise<void>;
    /**
       * Add file or folder to the zip object
       * @param {String} source Path to the source file or directory
       * @param {String} destination Path to the root folder inside the zip
       */
    private _add;
    /**
       * Stores all files into the ZipObject
       */
    private _processAll;
    /**
       * Add file to the zip object
       * @param {String} source Source path file
       * @param {String} destination Path to the destination inside zip
       */
    private _addFile;
    /**
       * Add dir and his content to the zip file
       * @param {String} source Path to the source directory
       * @param {String} destination Path to the destination folder inside zip
       */
    private _addDir;
    /**
       * Creates if not exists all folders of the path
       * @param {String} dir Path of the dir
       */
    private _ensureDir;
}
//# sourceMappingURL=index.d.ts.map