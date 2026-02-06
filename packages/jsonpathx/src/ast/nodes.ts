export type PathNode = {
  type: "Path";
  segments: SegmentNode[];
};

export type SegmentNode =
  | RootNode
  | CurrentNode
  | ChildNode
  | RecursiveNode
  | FilterNode
  | ScriptNode
  | ParentNode
  | PropertyNameNode
  | TypeSelectorNode;

export type RootNode = {
  type: "Root";
};

export type CurrentNode = {
  type: "Current";
};

export type ChildNode = {
  type: "Child";
  selector: SelectorNode;
};

export type RecursiveNode = {
  type: "Recursive";
  selector?: SelectorNode;
};

export type ParentNode = {
  type: "Parent";
};

export type PropertyNameNode = {
  type: "PropertyName";
};

export type TypeSelectorNode = {
  type: "TypeSelector";
  name: string;
};

export type FilterNode = {
  type: "Filter";
  expression: string;
};

export type ScriptNode = {
  type: "Script";
  expression: string;
};

export type SelectorNode =
  | WildcardSelector
  | IdentifierSelector
  | IndexSelector
  | SliceSelector
  | UnionSelector;

export type UnionItemNode = IdentifierSelector | IndexSelector | SliceSelector;

export type WildcardSelector = {
  type: "WildcardSelector";
};

export type IdentifierSelector = {
  type: "IdentifierSelector";
  name: string;
  quoted: boolean;
  escaped: boolean;
};

export type IndexSelector = {
  type: "IndexSelector";
  index: number;
};

export type SliceSelector = {
  type: "SliceSelector";
  start?: number;
  end?: number;
  step?: number;
};

export type UnionSelector = {
  type: "UnionSelector";
  items: UnionItemNode[];
};
