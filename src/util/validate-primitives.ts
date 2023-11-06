
export function isObject(val: unknown): val is Record<string, unknown> {
  return (
    ((typeof val) === 'object')
    && !Array.isArray(val)
    && (val !== null)
  );
}

export function isString(val: unknown): val is string {
  if((typeof val) === 'string') {
    return true;
  }
  return false;
}

export function isNumber(val: unknown): val is number {
  return (typeof val) === 'number';
}

export function isStringArray(val: unknown): val is string[] {
  return (
    Array.isArray(val)
    && val.every(isString)
  );
}
