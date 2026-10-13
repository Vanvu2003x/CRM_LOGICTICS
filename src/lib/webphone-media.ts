import type { RTCSession } from "jssip/lib/RTCSession";

type AudioSession = Pick<RTCSession, "connection" | "on">;

export function bindRemoteAudio(session: AudioSession, receive: (stream: MediaStream) => void) {
  const bound = new WeakSet<RTCPeerConnection>();
  const bind = (peerconnection: RTCPeerConnection) => {
    if (bound.has(peerconnection)) return;
    bound.add(peerconnection);
    peerconnection.addEventListener("track", (event) => {
      receive(event.streams[0] || new MediaStream([event.track]));
    });
    peerconnection.addEventListener("addstream", (event) => {
      const stream = (event as Event & { stream?: MediaStream }).stream;
      if (stream) receive(stream);
    });
    const tracks = peerconnection.getReceivers().map((receiver) => receiver.track).filter((track): track is MediaStreamTrack => track?.kind === "audio");
    if (tracks.length) receive(new MediaStream(tracks));
  };
  session.on("peerconnection", ({ peerconnection }) => bind(peerconnection));
  // JsSIP creates the peer connection before newRTCSession for outgoing calls.
  if (session.connection) bind(session.connection);
  return () => {
    const connection = session.connection;
    if (connection) bind(connection);
  };
}
