import { Button } from "@/components/ui/button";
import { CheckCircle2, Copy, MessageCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface InviteShareCardProps {
  code: string;
  link: string;
  memberName: string;
  farmName: string;
}

export function InviteShareCard({
  code,
  link,
  memberName,
  farmName,
}: InviteShareCardProps) {
  const [codeCopied, setCodeCopied] = useState(false);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCodeCopied(true);
      toast.success("Code copy ho gaya!");
      setTimeout(() => setCodeCopied(false), 3000);
    } catch {
      toast.error("Copy nahi hua. Manually select karein.");
    }
  };

  const whatsappMessage = encodeURIComponent(
    `${memberName} aapko ${farmName} mein join karne ke liye invite kar rahe hain.\nCode: ${code} — Ya is link se join karein: ${link}\nCode 24 ghante mein expire hoga. Link 7 din mein.`,
  );

  return (
    <div
      data-ocid="invite.share_card"
      className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 space-y-4"
    >
      {/* Invite code */}
      <div className="text-center space-y-1">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">
          Invite Code
        </p>
        <div
          data-ocid="invite.code_display"
          className="inline-block bg-primary/10 border border-primary/30 rounded-lg px-5 py-3"
        >
          <span className="font-mono text-2xl font-bold text-primary tracking-[0.25em] select-all">
            {code}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          24 ghante mein expire hoga
        </p>
      </div>

      {/* Link display */}
      <div className="bg-card rounded-lg border border-border px-3 py-2">
        <p className="text-xs text-muted-foreground mb-0.5">
          Invite Link (7 din)
        </p>
        <p className="text-xs text-foreground truncate font-mono">{link}</p>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button
          data-ocid="invite.copy_code_button"
          type="button"
          variant="outline"
          size="sm"
          className="flex-1 gap-2"
          onClick={handleCopyCode}
        >
          {codeCopied ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-primary" /> Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" /> Code Copy Karein
            </>
          )}
        </Button>
        <a
          data-ocid="invite.whatsapp_button"
          href={`https://wa.me/?text=${whatsappMessage}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1"
        >
          <Button
            type="button"
            variant="default"
            size="sm"
            className="w-full gap-2 bg-[#25D366] hover:bg-[#1da851] text-white border-0"
          >
            <MessageCircle className="w-4 h-4" /> WhatsApp
          </Button>
        </a>
      </div>
    </div>
  );
}
