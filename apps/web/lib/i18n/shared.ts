import { enMessages } from "./messages/en";

type DeepStringShape<T> = {
  [K in keyof T]: T[K] extends string
    ? string
    : T[K] extends Record<string, unknown>
      ? DeepStringShape<T[K]>
      : T[K];
};

type DeepPartialStringShape<T> = {
  [K in keyof T]?: T[K] extends string
    ? string
    : T[K] extends Record<string, unknown>
      ? DeepPartialStringShape<T[K]>
      : T[K];
};

type CompleteMessages = DeepStringShape<typeof enMessages>;

export type Messages = DeepPartialStringShape<CompleteMessages>;
export type MessageKey = NestedKeyOf<CompleteMessages>;

type NestedKeyOf<T> = {
  [K in keyof T & string]: T[K] extends Record<string, unknown>
    ? `${K}` | `${K}.${NestedKeyOf<T[K]>}`
    : `${K}`;
}[keyof T & string];

function getValueByPath(target: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (!acc || typeof acc !== "object") {
      return undefined;
    }

    return (acc as Record<string, unknown>)[key];
  }, target);
}

export function interpolate(template: string, values?: Record<string, string | number>) {
  if (!values) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? `{${key}}`));
}

export function createTranslator(messages: Messages) {
  return (key: MessageKey, values?: Record<string, string | number>) => {
    const resolved = getValueByPath(messages as unknown as Record<string, unknown>, key);
    const fallback = getValueByPath(enMessages as unknown as Record<string, unknown>, key);
    const text = typeof resolved === "string" ? resolved : typeof fallback === "string" ? fallback : key;
    return interpolate(text, values);
  };
}
