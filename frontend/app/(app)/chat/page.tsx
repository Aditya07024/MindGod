import { ProtectedGuard } from "@/components/layout/protected-guard";
import { ChatPage } from "@/components/chat/chat-page";

export default function ChatRoutePage() {
  return (
    <ProtectedGuard>
      <ChatPage />
    </ProtectedGuard>
  );
}
