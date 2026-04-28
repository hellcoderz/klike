export type KType = 'int' | 'float' | 'symbol' | 'list' | 'function' | 'native_function' | 'char' | 'dict';

export interface KValue {
    type: KType;
    value: any;
}

export const kInt = (value: number): KValue => ({ type: 'int', value });
export const kFloat = (value: number): KValue => ({ type: 'float', value });
export const kSymbol = (value: string): KValue => ({ type: 'symbol', value });
export const kList = (value: KValue[]): KValue => ({ type: 'list', value });
export const kChar = (value: string): KValue => ({ type: 'char', value });
export const kFunction = (params: string[], body: any, env: any): KValue => ({ type: 'function', value: { params, body, env } });
export const kNativeFunction = (fn: (args: KValue[]) => KValue): KValue => ({ type: 'native_function', value: fn });
export const kDict = (keys: KValue, values: KValue): KValue => ({ type: 'dict', value: { keys, values } });

export function kToString(k: KValue): string {
    switch (k.type) {
        case 'int': return k.value.toString();
        case 'float': return k.value.toString();
        case 'symbol': return "`" + k.value;
        case 'char': return k.value === '"' ? '\\"' : k.value;
        case 'list': 
            const list = k.value as KValue[];
            if (list.length > 0 && list.every(item => item.type === 'char')) {
                return `"${list.map(item => item.value).join('')}"`;
            }
            if (list.length > 1 && list.every(item => item.type === 'int' || item.type === 'float' || item.type === 'symbol')) {
                return list.map(kToString).join(" ");
            }
            return "(" + list.map(kToString).join("; ") + ")";
        case 'dict':
            return kToString(k.value.keys) + "!" + kToString(k.value.values);
        case 'function': return "{...}";
        case 'native_function': return "{native}";
        default: return "unknown";
    }
}
