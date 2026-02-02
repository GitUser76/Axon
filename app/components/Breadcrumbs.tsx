import Link from "next/link";

type Crumb = {
  label: string;
  href?: string;
};

type Props = {
  items: Crumb[];
};

export default function Breadcrumbs({ items }: Props) {
  return (
    <nav style={{ fontSize: 16, marginBottom: 24 }}>
      {items.map((item, index) => (
        <span key={index}>
          {item.href ? (
            <Link href={item.href} style={{ color: "#2563eb" }}>
              {item.label}
            </Link>
          ) : (
            <span>{item.label}</span>
          )}
          {index < items.length - 1 && " › "}
        </span>
      ))}
    </nav>
  );
}
