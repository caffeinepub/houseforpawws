import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, Loader2, MessageCircle, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { ConversationView } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetMessages,
  useGetMyConversations,
  useGetUserProfile,
  useSendMessage,
} from "../hooks/useQueries";

// ── Conversation Item ─────────────────────────────────────────────────────────

function ConversationItem({
  conv,
  currentPrincipal,
  isActive,
  onClick,
  index,
}: {
  conv: ConversationView;
  currentPrincipal: string;
  isActive: boolean;
  onClick: () => void;
  index: number;
}) {
  const otherPrincipal =
    conv.user1.toString() === currentPrincipal
      ? conv.user2.toString()
      : conv.user1.toString();
  const { data: otherProfile } = useGetUserProfile(otherPrincipal);

  const lastMsg = conv.messages[conv.messages.length - 1];
  const initials = otherProfile?.displayName?.slice(0, 2).toUpperCase() ?? "?";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/60 transition-colors rounded-xl",
        isActive && "bg-primary/10 hover:bg-primary/15",
      )}
      data-ocid={`inbox.conversation.item.${index}`}
    >
      <Avatar className="h-10 w-10 shrink-0">
        {otherProfile?.profilePhoto && (
          <AvatarImage src={otherProfile.profilePhoto.getDirectURL()} />
        )}
        <AvatarFallback className="bg-primary/20 text-primary text-sm font-semibold">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm font-semibold text-foreground truncate",
            isActive && "text-primary",
          )}
        >
          {otherProfile?.displayName ?? "Anonymous"}
        </p>
        {lastMsg && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {lastMsg.text}
          </p>
        )}
      </div>
    </button>
  );
}

// ── Message Bubble ────────────────────────────────────────────────────────────

function MessageBubble({
  text,
  isSent,
  timestamp,
}: {
  text: string;
  isSent: boolean;
  timestamp: bigint;
}) {
  const date = new Date(Number(timestamp / BigInt(1_000_000)));
  const timeStr = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={cn("flex", isSent ? "justify-end" : "justify-start")}>
      <div className="max-w-[70%] space-y-1">
        <div
          className={cn(
            "px-4 py-2.5 text-sm leading-relaxed",
            isSent ? "message-bubble-sent" : "message-bubble-received",
          )}
        >
          {text}
        </div>
        <p
          className={cn(
            "text-[10px] text-muted-foreground",
            isSent ? "text-right" : "text-left",
          )}
        >
          {timeStr}
        </p>
      </div>
    </div>
  );
}

// ── Chat Panel ────────────────────────────────────────────────────────────────

function ChatPanel({
  conversationId,
  currentPrincipal,
  conv,
}: {
  conversationId: string;
  currentPrincipal: string;
  conv: ConversationView | undefined;
}) {
  const { data: messages, isLoading } = useGetMessages(conversationId);
  const { mutateAsync: sendMsg, isPending: isSending } = useSendMessage();
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const otherPrincipal = conv
    ? conv.user1.toString() === currentPrincipal
      ? conv.user2.toString()
      : conv.user1.toString()
    : undefined;
  const { data: otherProfile } = useGetUserProfile(otherPrincipal);

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional scroll-to-bottom on messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages?.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    try {
      await sendMsg({ conversationId, text: trimmed });
      setText("");
    } catch {
      toast.error("Failed to send message.");
    }
  };

  const initials = otherProfile?.displayName?.slice(0, 2).toUpperCase() ?? "?";

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card shrink-0">
        <Link
          to="/users/$principal"
          params={{ principal: otherPrincipal ?? "" }}
        >
          <Avatar className="h-9 w-9">
            {otherProfile?.profilePhoto && (
              <AvatarImage src={otherProfile.profilePhoto.getDirectURL()} />
            )}
            <AvatarFallback className="bg-primary/20 text-primary text-sm font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div>
          <p className="text-sm font-semibold text-foreground">
            {otherProfile?.displayName ?? "Anonymous"}
          </p>
          {otherProfile?.location && (
            <p className="text-xs text-muted-foreground">
              {otherProfile.location}
            </p>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-4" data-ocid="inbox.messages.list">
        {isLoading ? (
          <div className="space-y-3" data-ocid="inbox.messages.loading_state">
            {(["ms1", "ms2", "ms3", "ms4"] as const).map((sk, i) => (
              <div
                key={sk}
                className={cn(
                  "flex",
                  i % 2 === 0 ? "justify-end" : "justify-start",
                )}
              >
                <Skeleton className="h-10 w-48 rounded-2xl" />
              </div>
            ))}
          </div>
        ) : messages?.length === 0 ? (
          <div
            className="h-full flex items-center justify-center"
            data-ocid="inbox.messages.empty_state"
          >
            <div className="text-center">
              <div className="text-4xl mb-2">💬</div>
              <p className="text-sm text-muted-foreground">
                Say hello to start the conversation!
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages?.map((msg) => (
              <MessageBubble
                key={`${msg.sender.toString()}-${msg.timestamp.toString()}`}
                text={msg.text}
                isSent={msg.sender.toString() === currentPrincipal}
                timestamp={msg.timestamp}
              />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border bg-card shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <Input
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1 rounded-full bg-muted border-0 focus-visible:ring-primary"
            data-ocid="inbox.message.input"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!text.trim() || isSending}
            className="rounded-full bg-primary text-primary-foreground shrink-0 shadow-paw"
            data-ocid="inbox.message.submit_button"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

// ── Inbox Page ────────────────────────────────────────────────────────────────

export default function InboxPage() {
  const { conversationId: paramConvId } = useParams({ strict: false }) as {
    conversationId?: string;
  };
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { data: conversations, isLoading } = useGetMyConversations();

  const [activeConvId, setActiveConvId] = useState<string | undefined>(
    paramConvId,
  );
  const [showSidebar, setShowSidebar] = useState(!paramConvId);

  useEffect(() => {
    if (!identity) navigate({ to: "/login" });
  }, [identity, navigate]);

  useEffect(() => {
    if (paramConvId) {
      setActiveConvId(paramConvId);
      setShowSidebar(false);
    }
  }, [paramConvId]);

  const currentPrincipal = identity?.getPrincipal().toString() ?? "";
  const activeConv = conversations?.find((c) => c.id === activeConvId);

  const handleSelectConv = (convId: string) => {
    setActiveConvId(convId);
    setShowSidebar(false);
    navigate({
      to: "/inbox/$conversationId",
      params: { conversationId: convId },
    });
  };

  if (!identity) return null;

  return (
    <div className="container py-0 px-0 md:px-8 md:py-8 max-w-5xl">
      <div className="bg-card rounded-none md:rounded-2xl border-0 md:border border-border overflow-hidden shadow-xs h-[calc(100vh-8rem)]">
        <div className="flex h-full">
          {/* Sidebar */}
          <div
            className={cn(
              "w-full md:w-72 lg:w-80 border-r border-border flex flex-col shrink-0",
              "md:flex",
              !showSidebar && "hidden md:flex",
            )}
          >
            {/* Sidebar header */}
            <div className="px-4 py-4 border-b border-border shrink-0">
              <h2 className="font-display text-lg font-bold text-foreground">
                Inbox
              </h2>
              <p className="text-xs text-muted-foreground">
                {conversations?.length ?? 0} conversation
                {(conversations?.length ?? 0) !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Conversation list */}
            <ScrollArea className="flex-1">
              <div className="p-2" data-ocid="inbox.conversations.list">
                {isLoading ? (
                  <div
                    className="space-y-2 p-2"
                    data-ocid="inbox.loading_state"
                  >
                    {["conv-sk1", "conv-sk2", "conv-sk3", "conv-sk4"].map(
                      (sk) => (
                        <div
                          key={sk}
                          className="flex items-center gap-3 px-2 py-2"
                        >
                          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                          <div className="space-y-1.5 flex-1">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-3 w-40" />
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                ) : conversations?.length === 0 ? (
                  <div
                    className="text-center py-10 px-4"
                    data-ocid="inbox.empty_state"
                  >
                    <div className="text-3xl mb-2">💬</div>
                    <p className="text-sm text-muted-foreground">
                      No conversations yet.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Apply to adopt a pet to start chatting!
                    </p>
                  </div>
                ) : (
                  conversations?.map((conv, i) => (
                    <ConversationItem
                      key={conv.id}
                      conv={conv}
                      currentPrincipal={currentPrincipal}
                      isActive={conv.id === activeConvId}
                      onClick={() => handleSelectConv(conv.id)}
                      index={i + 1}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Chat Panel */}
          <div
            className={cn(
              "flex-1 flex flex-col min-w-0",
              showSidebar && "hidden md:flex",
            )}
          >
            {/* Mobile back button */}
            <div className="flex items-center gap-2 md:hidden px-4 py-2 border-b border-border">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSidebar(true)}
                className="text-muted-foreground -ml-2"
                data-ocid="inbox.back.button"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Inbox
              </Button>
            </div>

            {activeConvId ? (
              <ChatPanel
                conversationId={activeConvId}
                currentPrincipal={currentPrincipal}
                conv={activeConv}
              />
            ) : (
              <div
                className="flex-1 flex items-center justify-center"
                data-ocid="inbox.no_selection.panel"
              >
                <div className="text-center">
                  <MessageCircle className="h-12 w-12 text-primary/30 mx-auto mb-3" />
                  <h3 className="font-display text-lg font-semibold text-foreground mb-1">
                    Select a conversation
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Choose from your conversations on the left.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
