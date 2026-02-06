import { query, querySync } from "../evaluator/index.js";
export class JSONPathQuery {
    path;
    options;
    constructor(path, options = {}) {
        this.path = path;
        this.options = { ...options };
        delete this.options.autostart;
    }
    async evaluate(data) {
        const result = await query(this.path, data, this.options);
        return result;
    }
    evaluateSync(data) {
        return querySync(this.path, data, this.options);
    }
    withOptions(options) {
        Object.assign(this.options, options);
        delete this.options.autostart;
        return this;
    }
    getPath() {
        return this.path;
    }
    getOptions() {
        return { ...this.options };
    }
}
