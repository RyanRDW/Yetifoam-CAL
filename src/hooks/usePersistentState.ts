import { useEffect, useRef, useState } from "react";

type PersistentStateOptions<T> = {
  parse?: (raw: string) => T;
  stringify?: (value: T) => string;
};

const defaultParse = <T,>(raw: string): T => JSON.parse(raw) as T;
const defaultStringify = <T,>(value: T): string => JSON.stringify(value);

export function usePersistentState<T>(
  key: string,
  defaultValue: T,
  options?: PersistentStateOptions<T>,
) {
  const parse = options?.parse ?? defaultParse<T>;
  const stringify = options?.stringify ?? defaultStringify<T>;

  const parseRef = useRef(parse);
  const stringifyRef = useRef(stringify);
  const keyRef = useRef(key);
  const defaultRef = useRef(defaultValue);

  parseRef.current = parse;
  stringifyRef.current = stringify;

  const readValue = () => {
    if (typeof window === "undefined" || !("localStorage" in window)) {
      return defaultValue;
    }

    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) {
        return defaultValue;
      }

      const parsed = parseRef.current(raw);
      return parsed ?? defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const [state, setState] = useState<T>(readValue);

  useEffect(() => {
    const keyChanged = keyRef.current !== key;
    const defaultChanged = defaultRef.current !== defaultValue;

    if (!keyChanged && !defaultChanged) {
      return;
    }

    keyRef.current = key;
    defaultRef.current = defaultValue;

    if (typeof window === "undefined" || !("localStorage" in window)) {
      setState(defaultValue);
      return;
    }

    setState(readValue());
  }, [key, defaultValue]);

  useEffect(() => {
    if (typeof window === "undefined" || !("localStorage" in window)) {
      return;
    }

    try {
      window.localStorage.setItem(key, stringifyRef.current(state));
    } catch {
      // ignore storage write errors
    }
  }, [key, state]);

  return [state, setState] as const;
}
