export type FunctionModifierProperties = {
  isPayable: boolean 
}

export type FunctionModifier = 
  | "public"
  | "private"
  | "external"
  | "internal"
  | "payable"
  | "view"
  | "pure"
  | "override"
  | "virtual"
  | "abstract";