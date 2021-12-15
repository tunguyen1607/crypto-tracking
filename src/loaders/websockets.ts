import WebSocket from "ws";
import queryString from "query-string";
import jwt from 'jsonwebtoken';
import config from "../config";
interface ExtWebSocket extends WebSocket {
  isAlive: boolean;
}
export class Message {
  constructor(
    public content: string,
    public isBroadcast = false,
    public sender: string
  ) { }
}
function createMessage(content: string, isBroadcast = false, sender = 'NS'): string {
  return JSON.stringify(new Message(content, isBroadcast, sender));
}
export default async (expressServer) => {
  const websocketServer = new WebSocket.Server({
    noServer: true,
    path: "/websockets",
  });
  expressServer.on("upgrade", (request, socket, head) => {
    websocketServer.handleUpgrade(request, socket, head, (websocket) => {
      websocketServer.emit("connection", websocket, request);
    });
  });
  var wsClients = [];
  websocketServer.on(
    "connection",
    function connection(websocketConnection, connectionRequest) {
      const extWs = websocketConnection as ExtWebSocket;

      extWs.isAlive = true;

      websocketConnection.on('pong', () => {
        console.log('ping')
        extWs.isAlive = true;
      });
      const [_path, params] = connectionRequest?.url?.split("?");
      const connectionParams = queryString.parse(params);

      // NOTE: connectParams are not used here but good to understand how to get
      // to them if you need to pass data with the connection to identify it (e.g., a userId).
      console.log(connectionParams);
      var token = connectionParams.token;

      var wsUsername = "";
      if(!token){
        websocketConnection.send(createMessage("Error: No token found. Please reauthenticate."));
        websocketConnection.close();
      }
      jwt.verify(token, config.jwtSecret, (err, decoded) => {
        if (err) {
          console.log(err);
          websocketConnection.send(createMessage("Error: Your token is no longer valid. Please reauthenticate."));
          websocketConnection.close();
        } else {
          // @ts-ignore
          wsClients[token] = websocketConnection;
          wsUsername = decoded.username;
          console.log(decoded);
          websocketConnection.send(JSON.stringify({type: 'connection_inited'}));
          websocketConnection.on("message", (msg) => {
            const message = JSON.parse(msg) as Message;
            try {
              for (const [token, client] of Object.entries(wsClients)) {
                jwt.verify(token, config.jwtSecret, (err, decoded) => {
                  if (err) {
                    client.send(createMessage("Error: Your token is no longer valid. Please reauthenticate."));
                    client.close();
                  } else {
                    client.send(createMessage(JSON.stringify(message)));
                  }
                });
              }
            }catch (e) {
              console.log(e);
              websocketConnection.close();
            }
          });
        }
      });

    }
  );
  setInterval(() => {
    websocketServer.clients.forEach((ws: WebSocket) => {

      const extWs = ws as ExtWebSocket;

      if (!extWs.isAlive) return ws.terminate();
      extWs.isAlive = false;

      ws.ping(null, undefined);
    });
  }, 30000);
  return websocketServer;
};
