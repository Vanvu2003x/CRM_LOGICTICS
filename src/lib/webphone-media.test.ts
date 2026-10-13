import { describe, expect, it, vi } from "vitest";
import type { RTCSession } from "jssip/lib/RTCSession";
import { bindRemoteAudio } from "./webphone-media";

function peer() {
  const handlers = new Map<string, (event: unknown) => void>();
  return {
    addEventListener: vi.fn((name: string, handler: (event: unknown) => void) => handlers.set(name, handler)),
    getReceivers: vi.fn(() => []),
    emitTrack(stream: MediaStream) { handlers.get("track")?.({ streams: [stream] }); },
  };
}

describe("webphone remote audio", () => {
  it("binds an outgoing connection that JsSIP created before newRTCSession", () => {
    const connection = peer();
    const session = { connection, on: vi.fn() } as unknown as RTCSession;
    const receive = vi.fn();
    bindRemoteAudio(session, receive);
    const stream = {} as MediaStream;
    connection.emitTrack(stream);
    expect(receive).toHaveBeenCalledWith(stream);
  });

  it("binds a later incoming connection only once", () => {
    const connection = peer();
    let onConnection: ((event: { peerconnection: RTCPeerConnection }) => void) | undefined;
    const session = { connection: null, on: vi.fn((_name, handler) => { onConnection = handler; }) } as unknown as RTCSession;
    const receive = vi.fn();
    bindRemoteAudio(session, receive);
    onConnection?.({ peerconnection: connection as unknown as RTCPeerConnection });
    onConnection?.({ peerconnection: connection as unknown as RTCPeerConnection });
    expect(connection.addEventListener).toHaveBeenCalledTimes(2);
  });
});
