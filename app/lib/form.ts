export function parseFormData<T extends Record<string, string>>(
  formData: FormData,
  keys: (keyof T)[]
): T {
  const result = {} as T;
  for (const key of keys) {
    const value = formData.get(key as string);
    if (value === null) throw new Error(`Missing field: ${String(key)}`);
    if (typeof value !== "string")
      throw new Error(`Field ${String(key)} must be a string`);
    result[key] = value as T[keyof T];
  }
  return result;
}
