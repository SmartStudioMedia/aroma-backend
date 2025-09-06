import { Server } from "socket.io";
export let io: Server;

export function attachSocket(httpServer: any) {
  io = new Server(httpServer, { cors: { origin: "*" } });
  io.on("connection", () => {/* you can add room logic */});
}

