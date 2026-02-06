export type ParentChainEntry = {
  property: string | number;
  parent: unknown;
};

export type ParentChainResult = {
  value: unknown;
  chain: ParentChainEntry[];
  rootPath: string;
  depth: number;
};

export type ParentChainConfig = {
  maxDepth?: number;
};

export class ParentChainTracker {
  private chain: ParentChainEntry[] = [];
  private maxDepth: number;

  constructor(config: ParentChainConfig = {}) {
    this.maxDepth = config.maxDepth ?? Infinity;
  }

  push(property: string | number, parent: unknown): void {
    if (this.chain.length < this.maxDepth) {
      this.chain.push({ property, parent });
    }
  }

  pop(): ParentChainEntry | undefined {
    return this.chain.pop();
  }

  getChain(): ParentChainEntry[] {
    return [...this.chain];
  }

  getDepth(): number {
    return this.chain.length;
  }

  clear(): void {
    this.chain = [];
  }

  getParent(level: number): ParentChainEntry | undefined {
    if (level < 0) {
      return this.chain[this.chain.length + level];
    }
    return this.chain[level];
  }

  buildPath(includeRoot = true): string {
    if (this.chain.length === 0) {
      return includeRoot ? "$" : "";
    }
    const parts: string[] = includeRoot ? ["$"] : [];
    for (const entry of this.chain) {
      if (typeof entry.property === "number") {
        parts.push(`[${entry.property}]`);
      } else {
        parts.push(`.${entry.property}`);
      }
    }
    return parts.join("");
  }

  createResult(value: unknown): ParentChainResult {
    return {
      value,
      chain: this.getChain(),
      rootPath: this.buildPath(),
      depth: this.getDepth()
    };
  }
}

export function buildParentChain(
  data: unknown,
  pathComponents: (string | number)[]
): ParentChainEntry[] {
  const chain: ParentChainEntry[] = [];
  let current = data;

  for (const component of pathComponents) {
    chain.push({ property: component, parent: current });
    if (current && typeof current === "object") {
      if (Array.isArray(current)) {
        current = current[component as number];
      } else {
        current = (current as any)[component];
      }
    } else {
      break;
    }
  }

  return chain;
}

export function getParentAtLevel(chain: ParentChainEntry[], level: number): ParentChainEntry | undefined {
  if (level < 0) {
    return chain[chain.length + level];
  }
  return chain[level];
}

export function navigateUp(chain: ParentChainEntry[], levels: number): unknown {
  if (levels <= 0 || levels > chain.length) {
    return undefined;
  }
  const targetIndex = chain.length - levels;
  return chain[targetIndex]?.parent;
}

export function getAncestors(chain: ParentChainEntry[]): unknown[] {
  return chain.map((entry) => entry.parent);
}

export function getPropertyPath(chain: ParentChainEntry[]): (string | number)[] {
  return chain.map((entry) => entry.property);
}
