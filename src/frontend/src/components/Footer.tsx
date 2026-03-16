import { Link } from "@tanstack/react-router";
import { Heart, PawPrint } from "lucide-react";

export default function Footer() {
  const hostname =
    typeof window !== "undefined" ? window.location.hostname : "";
  const caffeineUrl = `https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(hostname)}`;

  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="container py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
            <PawPrint className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="font-display font-semibold text-foreground">
            House<span className="text-primary">For</span>Pawws
          </span>
        </div>

        <nav className="flex items-center gap-6 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-primary transition-colors">
            Browse
          </Link>
          <Link to="/pets/new" className="hover:text-primary transition-colors">
            List a Pet
          </Link>
          <Link to="/inbox" className="hover:text-primary transition-colors">
            Inbox
          </Link>
        </nav>

        <p className="text-xs text-muted-foreground flex items-center gap-1">
          A student initiative by Bhavya Jotwani{" "}
          <Heart className="h-3 w-3 text-primary fill-primary" /> powered by{" "}
          <a
            href={caffeineUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary underline underline-offset-2 transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </footer>
  );
}
