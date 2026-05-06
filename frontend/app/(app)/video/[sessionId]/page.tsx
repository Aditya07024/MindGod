import { SessionRoomPage } from "@/components/experience/session-room";

export default function VideoPage({ params }: { params: { sessionId: string } }) {
  return <SessionRoomPage sessionId={params.sessionId} />;
}
