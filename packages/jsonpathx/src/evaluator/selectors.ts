import type {
  IdentifierSelector,
  IndexSelector,
  SelectorNode,
  SliceSelector,
  UnionItemNode,
  WildcardSelector
} from "../ast/nodes.js";
import type { EvalContext } from "./context.js";
import { createChildContext } from "./context.js";

export function applySelector(context: EvalContext, selector: SelectorNode): EvalContext[] {
  switch (selector.type) {
    case "WildcardSelector":
      return selectWildcard(context, selector);
    case "IdentifierSelector":
      return selectIdentifier(context, selector);
    case "IndexSelector":
      return selectIndex(context, selector);
    case "SliceSelector":
      return selectSlice(context, selector);
    case "UnionSelector":
      return selectUnion(context, selector.items);
    default:
      return [];
  }
}

function selectWildcard(context: EvalContext, _selector: WildcardSelector): EvalContext[] {
  const { value } = context;
  if (Array.isArray(value)) {
    const results = new Array<EvalContext>(value.length);
    for (let i = 0; i < value.length; i += 1) {
      results[i] = createChildContext(context, i, value[i]);
    }
    return results;
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const results: EvalContext[] = [];
    for (const key in record) {
      if (Object.prototype.hasOwnProperty.call(record, key)) {
        results.push(createChildContext(context, key, record[key]));
      }
    }
    return results;
  }
  return [];
}

function selectIdentifier(context: EvalContext, selector: IdentifierSelector): EvalContext[] {
  const { value } = context;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [];
  }
  const record = value as Record<string, unknown>;
  if (Object.prototype.hasOwnProperty.call(record, selector.name)) {
    return [createChildContext(context, selector.name, record[selector.name])];
  }
  return [];
}

function selectIndex(context: EvalContext, selector: IndexSelector): EvalContext[] {
  const { value } = context;
  if (!Array.isArray(value)) {
    return [];
  }
  const index = selector.index < 0 ? value.length + selector.index : selector.index;
  if (index < 0 || index >= value.length) {
    return [];
  }
  return [createChildContext(context, index, value[index])];
}

function selectSlice(context: EvalContext, selector: SliceSelector): EvalContext[] {
  const { value } = context;
  if (!Array.isArray(value)) {
    return [];
  }
  const length = value.length;
  const step = selector.step ?? 1;
  if (step === 0) {
    return [];
  }
  let start = selector.start ?? (step > 0 ? 0 : length - 1);
  let end = selector.end ?? (step > 0 ? length : -1);
  if (step > 0) {
    start = normalizeIndex(start, length);
    end = normalizeIndex(end, length);
    start = clamp(start, 0, length);
    end = clamp(end, 0, length);
  } else {
    start = normalizeIndex(start, length);
    if (selector.end != null) {
      end = normalizeIndex(end, length);
    }
    start = clamp(start, -1, length - 1);
    end = clamp(end, -1, length - 1);
  }
  if (step > 0) {
    const count = start < end ? Math.ceil((end - start) / step) : 0;
    const results = new Array<EvalContext>(count);
    let pos = 0;
    for (let i = start; i < end; i += step) {
      results[pos] = createChildContext(context, i, value[i]);
      pos += 1;
    }
    return results;
  } else {
    if (start < 0) {
      return [];
    }
    const count = start > end ? Math.ceil((start - end) / -step) : 0;
    const results = new Array<EvalContext>(count);
    let pos = 0;
    for (let i = start; i > end; i += step) {
      results[pos] = createChildContext(context, i, value[i]);
      pos += 1;
    }
    return results;
  }
}

function normalizeIndex(index: number, length: number) {
  if (index < 0) {
    return length + index;
  }
  return index;
}

function clamp(value: number, min: number, max: number) {
  if (value < min) {
    return min;
  }
  if (value > max) {
    return max;
  }
  return value;
}

function selectUnionItem(context: EvalContext, item: UnionItemNode): EvalContext[] {
  if (item.type === "WildcardSelector") {
    return selectWildcard(context, item);
  }
  if (item.type === "IdentifierSelector") {
    return selectIdentifier(context, item);
  }
  if (item.type === "IndexSelector") {
    return selectIndex(context, item);
  }
  return selectSlice(context, item);
}

function selectUnion(context: EvalContext, items: UnionItemNode[]): EvalContext[] {
  const results: EvalContext[] = [];
  for (const item of items) {
    const selected = selectUnionItem(context, item);
    for (const entry of selected) {
      results.push(entry);
    }
  }
  return results;
}
