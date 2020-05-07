/// <reference types="node" />
import { ServerResponse } from "http";
export default class MyZip {
    private zip;
    private excludes;
    private sources;
    private exit;
    private customFilter;
    constructor();
    exclude(pattern: string | RegExp): MyZip;
    filter(func: (itemPath: string) => boolean | Promise<boolean>): MyZip;
    add(source: string, destination: string, newName?: string): MyZip;
    exitOnError(value: boolean): MyZip;
    save(destination: string): Promise<void>;
    pipe(res: ServerResponse, name: string): Promise<void>;
    extract(source: string, destination: string): Promise<void>;
    private _add;
    private _processAll;
    private _addFile;
    private _addDir;
    private _ensureDir;
}
//# sourceMappingURL=index.d.ts.map