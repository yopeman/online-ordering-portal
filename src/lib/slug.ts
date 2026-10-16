/** Slug helpers shared by models and forms. */

/** Converts arbitrary text into a url friendly slug. */
export function slugify(input: string): string {
  return (
    input
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "") // strip accents
      .replace(/[^\p{L}\p{N}]+/gu, "-") // non letters/numbers -> dash
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "item"
  );
}

/**
 * Appends `-2`, `-3`, ... until `exists(slug)` returns false so slugs stay
 * unique across the collection.
 */
export async function uniqueSlug(
  base: string,
  exists: (candidate: string) => Promise<boolean>,
): Promise<string> {
  const root = slugify(base);
  if (!(await exists(root))) return root;

  for (let i = 2; i < 1000; i += 1) {
    const candidate = `${root}-${i}`;
    if (!(await exists(candidate))) return candidate;
  }

  return `${root}-${Date.now().toString(36)}`;
}

/** Builds a slug for an entity, appending the id when the name collides. */
export function slugWithId(name: string, id: string): string {
  return `${slugify(name)}-${id.slice(-6)}`;
}