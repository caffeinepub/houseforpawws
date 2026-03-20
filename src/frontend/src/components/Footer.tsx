import { Link } from "@tanstack/react-router";
import { Heart, PawPrint } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-primary/10 gradient-paw mt-auto relative overflow-hidden">
      {/* Decorative paw prints */}
      <span className="absolute left-4 top-3 text-primary/8 text-4xl select-none pointer-events-none">
        🐾
      </span>
      <span className="absolute right-8 bottom-2 text-primary/6 text-5xl select-none pointer-events-none">
        🐾
      </span>
      <span className="absolute left-1/2 top-1 text-primary/5 text-3xl select-none pointer-events-none">
        🐾
      </span>

      <div className="container py-8 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
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
          <Heart className="h-3 w-3 text-primary fill-primary" />
        </p>
      </div>
    </footer>
  );
}
