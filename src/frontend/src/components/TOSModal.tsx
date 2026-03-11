import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PawPrint } from "lucide-react";

interface TOSModalProps {
  children: React.ReactNode;
}

export default function TOSModal({ children }: TOSModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg" data-ocid="tos.dialog">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2 text-xl">
            <PawPrint className="h-5 w-5 text-primary" />
            Terms of Service
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[420px] pr-4">
          <div className="space-y-5 text-sm text-muted-foreground leading-relaxed">
            <p className="text-foreground font-medium">
              Welcome to HouseForPawws! By using our platform, you agree to the
              following terms. Please read them carefully.
            </p>

            <section className="space-y-2">
              <h3 className="font-semibold text-foreground">
                1. Be Kind & Respectful
              </h3>
              <p>
                All users must treat fellow community members, pet listers, and
                adopters with respect and kindness. Harassment, hate speech, or
                abusive behaviour of any kind will result in immediate account
                suspension.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-foreground">
                2. List Only Real Pets
              </h3>
              <p>
                Every pet listed for adoption must be a real animal in your care
                or custody. Fictitious, duplicate, or misleading listings are
                strictly prohibited. Providing false information about a pet's
                health, age, or status is a violation of these terms.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-foreground">
                3. Accurate Health Information
              </h3>
              <p>
                You must truthfully disclose the health status, vaccination
                history, and any known medical conditions of pets you list.
                Concealing information that may affect an adopter's decision is
                not permitted.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-foreground">
                4. No Spam or Commercial Solicitation
              </h3>
              <p>
                HouseForPawws is not a marketplace for buying or selling pets.
                You may not use the platform to advertise commercial breeding
                operations, solicit payments for adoptions, or send unsolicited
                promotional messages to other users.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-foreground">
                5. Privacy & Personal Data
              </h3>
              <p>
                Your display name is public. Your email address and phone number
                are private and will not be shared with other users without your
                consent. You are responsible for keeping your login credentials
                secure.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-foreground">
                6. Responsible Adoption
              </h3>
              <p>
                Adopters agree to provide a safe, loving, and appropriate home
                for any pet they adopt through this platform. You must not
                abandon, resell, or transfer an adopted pet without proper care
                arrangements.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-foreground">
                7. Content Ownership
              </h3>
              <p>
                You retain ownership of any photos or text you upload. By
                posting content, you grant HouseForPawws a non-exclusive licence
                to display that content on the platform for the purpose of
                facilitating adoptions.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-semibold text-foreground">8. Enforcement</h3>
              <p>
                We reserve the right to remove listings, warn users, or suspend
                accounts that violate these terms. Decisions are made at our
                discretion and with the welfare of animals as the top priority.
              </p>
            </section>

            <p className="text-xs text-muted-foreground/70 pt-2 border-t border-border">
              Last updated: March 2026. These terms may be updated periodically.
              Continued use of the platform constitutes acceptance of any
              revised terms.
            </p>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
