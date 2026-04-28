import { ASTNode, ProgramNode } from "./parser.ts";
import { KValue, kInt, kFloat, kSymbol, kList, kChar, kToString, kFunction, kDict, kNativeFunction } from "./types.ts";

export class Environment {
    private store: Map<string, KValue> = new Map();
    private parent: Environment | null;

    constructor(parent: Environment | null = null) {
        this.parent = parent;
        if (parent === null) {
            this.loadBuiltins();
        }
    }

    private loadBuiltins() {
        const mathUnary = (name: string, fn: (n: number) => number) => {
            this.set(name, kNativeFunction((args: KValue[]) => {
                if (args.length === 0) return kInt(0);
                const arg = args.length === 1 ? args[0] : kList(args);
                const apply = (v: KValue): KValue => {
                    if (v.type === 'int' || v.type === 'float') {
                        const res = fn(v.value);
                        return res % 1 === 0 ? kInt(res) : kFloat(res);
                    }
                    if (v.type === 'list') {
                        return kList((v.value as KValue[]).map(apply));
                    }
                    return v;
                };
                return apply(arg);
            }));
        };

        mathUnary('abs', Math.abs);
        mathUnary('sqrt', Math.sqrt);
        mathUnary('sin', Math.sin);
        mathUnary('cos', Math.cos);
        mathUnary('exp', Math.exp);
        mathUnary('log', Math.log);
        mathUnary('floor', Math.floor);
        mathUnary('ceil', Math.ceil);
    }

    set(name: string, value: KValue) {
        this.store.set(name, value);
    }

    get(name: string): KValue {
        if (this.store.has(name)) {
            return this.store.get(name)!;
        }
        if (this.parent) {
            return this.parent.get(name);
        }
        throw new Error(`Undefined variable: ${name}`);
    }
}

export class Interpreter {
    private env: Environment;

    constructor(env?: Environment) {
        this.env = env || new Environment();
    }

    public eval(node: ASTNode): KValue {
        switch (node.type) {
            case 'Program':
                let result: KValue = kInt(0);
                for (const expr of node.body) {
                    result = this.eval(expr);
                }
                return result;
            case 'Number':
                return node.value % 1 === 0 ? kInt(node.value) : kFloat(node.value);
            case 'String':
                return kList(node.value.split('').map(kChar));
            case 'Symbol':
                return kSymbol(node.value);
            case 'Identifier':
                return this.env.get(node.name);
            case 'Array': {
                const elems = node.elements.map(e => this.eval(e));
                if (elems.length > 0 && (elems[0].type === 'function' || elems[0].type === 'native_function')) {
                    return this.applyFunction(elems[0], elems.slice(1));
                }
                return kList(elems);
            }
            case 'Function':
                return kFunction(node.params, node.body, this.env);
            case 'Index': {
                const target = this.eval(node.target);
                const indices = node.indices.map(e => this.eval(e));
                if (target.type === 'function' || target.type === 'native_function') {
                    return this.applyFunction(target, indices);
                }
                return this.applyIndex(target, indices);
            }
            case 'Assignment': {
                const value = this.eval(node.value);
                this.env.set(node.name, value);
                return value;
            }
            case 'BinaryOp':
                return this.evalBinary(node.op, this.eval(node.left), this.eval(node.right), node.adverb);
            case 'UnaryOp':
                return this.evalUnary(node.op, this.eval(node.right), node.adverb);
            case 'Conditional': {
                const cond = this.eval(node.cond);
                if (cond.type === 'int' && cond.value !== 0) {
                    return this.eval(node.trueBranch);
                }
                return this.eval(node.falseBranch);
            }
            default:
                throw new Error(`Unsupported node type: ${(node as any).type}`);
        }
    }

    private applyFunction(func: KValue, args: KValue[]): KValue {
        if (func.type === 'native_function') {
            return (func.value as (args: KValue[]) => KValue)(args);
        }
        if (func.type !== 'function') throw new Error("Target is not a function");
        const { params, body, env: closureEnv } = func.value;
        const newEnv = new Environment(closureEnv);
        
        for (let i = 0; i < params.length; i++) {
            if (i < args.length) {
                newEnv.set(params[i], args[i]);
            } else {
                newEnv.set(params[i], kInt(0)); // default argument?
            }
        }
        
        const interpreter = new Interpreter(newEnv);
        let result: KValue = kInt(0);
        for (const expr of body) {
            result = interpreter.eval(expr);
        }
        return result;
    }

    private applyIndex(target: KValue, indices: KValue[]): KValue {
        if (indices.length === 0) return target;
        if (target.type === 'function' || target.type === 'native_function') return this.applyFunction(target, indices);
        if (target.type === 'dict') {
            const keys = target.value.keys.value as KValue[];
            const values = target.value.values.value as KValue[];
            const key = indices[0];
            const foundIdx = keys.findIndex(k => this.matchValues(k, key));
            if (foundIdx === -1) throw new Error(`Key error: ${kToString(key)}`);
            const res = values[foundIdx];
            if (indices.length > 1) return this.applyIndex(res, indices.slice(1));
            return res;
        }
        if (target.type !== 'list') throw new Error(`Target is not indexable: ${kToString(target)}`);
        
        const list = target.value as KValue[];
        const idx = indices[0];
        
        if (idx.type === 'int') {
            const i = idx.value as number;
            if (i < 0 || i >= list.length) throw new Error("Index out of bounds");
            const res = list[i];
            if (indices.length > 1) {
                return this.applyIndex(res, indices.slice(1));
            }
            return res;
        } else if (idx.type === 'list') {
            // vector indexing
            const resElems = (idx.value as KValue[]).map(innerIdx => {
                if (innerIdx.type === 'int') {
                    const i = innerIdx.value as number;
                    if (i < 0 || i >= list.length) throw new Error("Index out of bounds");
                    return list[i];
                }
                throw new Error("Invalid index type in vector indexing");
            });
            const res = kList(resElems);
            if (indices.length > 1) {
                return this.applyIndex(res, indices.slice(1));
            }
            return res;
        }
        
        throw new Error("Invalid index type");
    }

    private evalBinary(op: string, left: KValue, right: KValue, adverb?: string): KValue {
        if (adverb === '/') {
            if (right.type !== 'list') return right;
            const list = right.value as KValue[];
            let res = left;
            for (const item of list) {
                res = this.evalBinary(op, res, item);
            }
            return res;
        }
        if (adverb === '\\') {
            if (right.type !== 'list') return right;
            const list = right.value as KValue[];
            let res = left;
            const results = [];
            for (const item of list) {
                res = this.evalBinary(op, res, item);
                results.push(res);
            }
            return kList(results);
        }
        if (adverb === "'") {
            if (left.type !== 'list' || right.type !== 'list') throw new Error("Each expects list arguments");
            const lArr = left.value as KValue[];
            const rArr = right.value as KValue[];
            if (lArr.length !== rArr.length) throw new Error("Length error in each");
            const res = [];
            for (let i = 0; i < lArr.length; i++) {
                res.push(this.evalBinary(op, lArr[i], rArr[i]));
            }
            return kList(res);
        }
        if (adverb === '\\:') { // Each Left
            if (left.type !== 'list') return this.evalBinary(op, left, right);
            const list = left.value as KValue[];
            return kList(list.map(item => this.evalBinary(op, item, right)));
        }
        if (adverb === '/:') { // Each Right
            if (right.type !== 'list') return this.evalBinary(op, left, right);
            const list = right.value as KValue[];
            return kList(list.map(item => this.evalBinary(op, left, item)));
        }

        if (op === '!') { // Create Dict
            return kDict(left, right);
        }

        if (op === '.') { // Deep Indexing
            if (right.type !== 'list') return this.applyIndex(left, [right]);
            return this.applyIndex(left, right.value as KValue[]);
        }

        if (op === ',') {
           const lArr = left.type === 'list' ? left.value as KValue[] : [left];
           const rArr = right.type === 'list' ? right.value as KValue[] : [right];
           return kList([...lArr, ...rArr]);
        }
        
        if (op === '?') {
            if (left.type === 'list') {
                const lArr = left.value as KValue[];
                let foundIndex = lArr.length;
                for (let i = 0; i < lArr.length; i++) {
                    if (this.matchValues(lArr[i], right)) {
                        foundIndex = i;
                        break;
                    }
                }
                return kInt(foundIndex);
            }
        }

        if (op === '#') { // Take / Reshape
            if (left.type === 'int') {
                if (right.type !== 'list') return right;
                const n = left.value as number;
                const list = right.value as KValue[];
                if (n === 0) return kList([]);
                if (n > 0) {
                    const res = [];
                    for (let i = 0; i < n; i++) res.push(list[i % list.length]);
                    return kList(res);
                } else {
                    const res = [];
                    for (let i = 0; i < -n; i++) res.push(list[(list.length + ((-i-1) % list.length)) % list.length]);
                    return kList(res.reverse());
                }
            } else if (left.type === 'list') {
                const dims = left.value as KValue[];
                if (dims.length === 0) return right;
                const n = dims[0].value as number;
                const flat = right.type === 'list' ? right.value as KValue[] : [right];
                const res = [];
                const itemsPerSub = dims.slice(1).reduce((a, b) => a * b.value, 1) || 1;
                for (let i = 0; i < n; i++) {
                    const subList = [];
                    for (let j = 0; j < itemsPerSub; j++) subList.push(flat[(i * itemsPerSub + j) % flat.length]);
                    res.push(dims.length === 1 ? subList[0] : this.evalBinary('#', kList(dims.slice(1)), kList(subList)));
                }
                if (dims.length === 1) {
                    const final = [];
                    for(let i=0; i<n; i++) final.push(flat[i % flat.length]);
                    return kList(final);
                }
                return kList(res);
            }
        }

        if (op === '_') { // Drop
            if (left.type !== 'int') throw new Error("Drop count must be int");
            if (right.type !== 'list') return right;
            const n = left.value as number;
            const list = right.value as KValue[];
            return kList(n >= 0 ? list.slice(n) : list.slice(0, n));
        }

        if (op === '~') { // Match
            return kInt(this.matchValues(left, right) ? 1 : 0);
        }

        if (op === '|') { // Rotate
            if (left.type !== 'int') throw new Error("Rotate expects int");
            if (right.type !== 'list') return right;
            const n = left.value as number;
            const list = right.value as KValue[];
            if (list.length === 0) return kList([]);
            const shift = ((n % list.length) + list.length) % list.length;
            return kList([...list.slice(shift), ...list.slice(0, shift)]);
        }

        if (left.type === 'list' && right.type !== 'list') {
            return kList((left.value as KValue[]).map(v => this.evalBinary(op, v, right)));
        }
        if (left.type !== 'list' && right.type === 'list') {
            return kList((right.value as KValue[]).map(v => this.evalBinary(op, left, v)));
        }
        if (left.type === 'list' && right.type === 'list') {
            const lArr = left.value as KValue[];
            const rArr = right.value as KValue[];
            if (lArr.length !== rArr.length) throw new Error("Length error in binary operation");
            const res = [];
            for (let i = 0; i < lArr.length; i++) {
                res.push(this.evalBinary(op, lArr[i], rArr[i]));
            }
            return kList(res);
        }

        if ((left.type === 'int' || left.type === 'float') && (right.type === 'int' || right.type === 'float')) {
            const l = left.value as number;
            const r = right.value as number;
            switch (op) {
                case '+': return kInt(l + r);
                case '-': return kInt(l - r);
                case '*': return kInt(l * r);
                case '%': return kFloat(l / r);
                case '<': return kInt(l < r ? 1 : 0);
                case '>': return kInt(l > r ? 1 : 0);
                case '=': return kInt(l === r ? 1 : 0);
                case '&': return kInt(Math.min(l, r)); 
                case '|': return kInt(Math.max(l, r)); 
                default: throw new Error(`Unsupported binary op: ${op}`);
            }
        }

        throw new Error(`Type error in binary operation '${op}': ${kToString(left)} and ${kToString(right)}`);
    }

    private evalUnary(op: string, right: KValue, adverb?: string): KValue {
        if (adverb === '/') {
            if (right.type !== 'list') return right;
            const list = right.value as KValue[];
            if (list.length === 0) throw new Error("Over on empty list");
            let res = list[0];
            for (let i = 1; i < list.length; i++) {
                res = this.evalBinary(op, res, list[i]);
            }
            return res;
        }
        if (adverb === '\\') {
            if (right.type !== 'list') return right;
            const list = right.value as KValue[];
            if (list.length === 0) return kList([]);
            let res = list[0];
            const results = [res];
            for (let i = 1; i < list.length; i++) {
                res = this.evalBinary(op, res, list[i]);
                results.push(res);
            }
            return kList(results);
        }
        if (adverb === "'") {
            if (right.type !== 'list') throw new Error("Each expects list");
            const list = right.value as KValue[];
            return kList(list.map(v => this.evalUnary(op, v)));
        }

        if (op === '!') {
            if (right.type === 'dict') return right.value.keys;
            if (right.type === 'int') {
                const n = right.value as number;
                const arr = [];
                for (let i = 0; i < n; i++) arr.push(kInt(i));
                return kList(arr);
            }
        }
        if (op === '.') {
            if (right.type === 'dict') return right.value.values;
            throw new Error("Unary . only supported for dicts (values)");
        }
        if (op === '#') {
            if (right.type === 'list') {
                return kInt((right.value as KValue[]).length);
            }
            return kInt(1);
        }
        if (op === '&') { // Where
            if (right.type === 'list') {
                const list = right.value as KValue[];
                const res = [];
                for (let i = 0; i < list.length; i++) {
                    if (list[i].type === 'int' && list[i].value > 0) {
                        for (let j = 0; j < list[i].value; j++) res.push(kInt(i));
                    }
                }
                return kList(res);
            }
        }
        if (op === '|') { // Reverse
            if (right.type === 'list') {
                return kList([...(right.value as KValue[])].reverse());
            }
            return right;
        }
        if (op === '+') { // Flip / Transpose
            if (right.type === 'dict') {
                const keys = right.value.keys.value as KValue[];
                const values = right.value.values.value as KValue[];
                if (values.length > 0 && values.every(v => v.type === 'list')) {
                    const rowCount = (values[0].value as KValue[]).length;
                    const rows = [];
                    for (let i = 0; i < rowCount; i++) {
                        const rowValues = values.map(v => (v.value as KValue[])[i]);
                        rows.push(kDict(kList(keys), kList(rowValues)));
                    }
                    return kList(rows);
                }
            }
            if (right.type === 'list' && (right.value as KValue[]).every(v => v.type === 'list')) {
                const matrix = right.value as KValue[];
                if (matrix.length === 0) return right;
                const rowCount = matrix.length;
                const colCount = (matrix[0].value as KValue[]).length;
                const result = [];
                for (let j = 0; j < colCount; j++) {
                    const newRow = [];
                    for (let i = 0; i < rowCount; i++) {
                        newRow.push((matrix[i].value as KValue[])[j]);
                    }
                    result.push(kList(newRow));
                }
                return kList(result);
            }
            if (right.type === 'int' || right.type === 'float') {
                return right;
            }
        }
        if (op === '-') {
            if (right.type === 'int' || right.type === 'float') {
                return right.type === 'int' ? kInt(-right.value) : kFloat(-right.value);
            }
            if (right.type === 'list') {
                return kList((right.value as KValue[]).map(v => this.evalUnary('-', v)));
            }
        }
        if (op === '<') { // Grade Up
            if (right.type === 'list') {
                const list = right.value as KValue[];
                const indices = Array.from({length: list.length}, (_, i) => i);
                indices.sort((a, b) => {
                    const va = list[a];
                    const vb = list[b];
                    if (va.value < vb.value) return -1;
                    if (va.value > vb.value) return 1;
                    return 0;
                });
                return kList(indices.map(kInt));
            }
        }
        if (op === '>') { // Grade Down
            if (right.type === 'list') {
                const list = right.value as KValue[];
                const indices = Array.from({length: list.length}, (_, i) => i);
                indices.sort((a, b) => {
                    const va = list[a];
                    const vb = list[b];
                    if (va.value > vb.value) return -1;
                    if (va.value < vb.value) return 1;
                    return 0;
                });
                return kList(indices.map(kInt));
            }
        }
        if (op === '=') { // Group
            if (right.type === 'list') {
                const list = right.value as KValue[];
                const groups = new Map<any, number[]>();
                const keys: KValue[] = [];
                for (let i = 0; i < list.length; i++) {
                    const val = list[i].value;
                    if (!groups.has(val)) {
                        groups.set(val, []);
                        keys.push(list[i]);
                    }
                    groups.get(val)!.push(i);
                }
                const values = keys.map(k => kList(groups.get(k.value)!.map(kInt)));
                return kDict(kList(keys), kList(values));
            }
        }
        if (op === ',') { // Enlist
            return kList([right]);
        }
        if (op === '_') { // Floor
            if (right.type === 'int' || right.type === 'float') {
                return kInt(Math.floor(right.value));
            }
            if (right.type === 'list') {
                return kList((right.value as KValue[]).map(v => this.evalUnary('_', v)));
            }
        }
        if (op === '@') {
            switch (right.type) {
                case 'int': return kSymbol('i');
                case 'float': return kSymbol('f');
                case 'char': return kSymbol('c');
                case 'symbol': return kSymbol('s');
                case 'list': return kSymbol('L');
                case 'function': return kSymbol('l'); 
                case 'dict': return kSymbol('d');
                default: return kSymbol('unknown');
            }
        }
        if (op === '$') {
            return kList(kToString(right).split('').map(kChar));
        }

        throw new Error(`Type error or unsupported unary operation '${op}' on ${kToString(right)}`);
    }

    private matchValues(a: KValue, b: KValue): boolean {
        if (a.type !== b.type) return false;
        if (a.type === 'list') {
            const aList = a.value as KValue[];
            const bList = b.value as KValue[];
            if (aList.length !== bList.length) return false;
            return aList.every((v, i) => this.matchValues(v, bList[i]));
        }
        if (a.type === 'dict') {
            return this.matchValues(a.value.keys, b.value.keys) && this.matchValues(a.value.values, b.value.values);
        }
        return a.value === b.value;
    }
}
