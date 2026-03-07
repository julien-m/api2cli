export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-muted/10">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <span className="font-[family-name:var(--font-geist-pixel-square)] text-xs text-muted-foreground/60">
          api2cli
        </span>
        <a
          href="mailto:contact@api2cli.dev"
          className="text-xs text-muted-foreground/40 transition-colors hover:text-muted-foreground"
        >
          Contact
        </a>
      </div>
    </footer>
  );
}
