export function initials(name: string) {
  if (!name) return "";

  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
}

export function pluralize(count: number, singular: string) {
  return count > 1 ? `${singular}s` : singular;
}

export function capitalize(input: string) {
  if (!input) return input;
  return input.charAt(0).toUpperCase() + input.slice(1);
}

export function shortname(name: string) {
  const parts = name.split(" ").slice(0, 2);

  if (parts.length === 1) {
    return parts[0].substring(0, 3);
  }

  if (parts.length === 2) {
    return parts[0].substring(0, 3) + parts[1].substring(0, 2);
  }

  return "";
}

export function convertNameToColor(colors: string[], name: string) {
  let hash = 0;

  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}
