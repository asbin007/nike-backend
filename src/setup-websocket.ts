import { Server } from "socket.io";

export function getIoInstance(): Server | undefined {
  if (typeof (global as any).io !== 'undefined') {
    return (global as any).io as Server;
  }
  return undefined;
}
