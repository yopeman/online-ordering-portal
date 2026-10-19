import Image from "next/image";

const SIZES = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
} as const;

export function Avatar({
  name,
  src,
  size = "md",
}: {
  name: string;
  src?: string;
  size?: keyof typeof SIZES;
}) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={56}
        height={56}
        unoptimized={src.startsWith("data:") || src.startsWith("http://")}
        className={`${SIZES[size]} rounded-full object-cover`}
      />
    );
  }

  return (
    <span
      className={`${SIZES[size]} inline-flex items-center justify-center rounded-full bg-primary-soft font-semibold text-primary`}
    >
      {initials || "?"}
    </span>
  );
}