import type { BlockDefinition } from "./types";

export function defineBlock<TType extends string, TData>(
  definition: BlockDefinition<TType, TData>
) {
  return definition;
}

