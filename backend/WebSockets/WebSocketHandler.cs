using System.Net.WebSockets;
using System.Text;

namespace backend.WebSockets
{
    public static class WebSocketHandler
    {
        private static readonly List<WebSocket> _clients = new();

        public static async Task HandleChatConnectionAsync(HttpContext context, WebSocket webSocket)
        {
            _clients.Add(webSocket);
            var buffer = new byte[1024 * 4];

            while (webSocket.State == WebSocketState.Open)
            {
                var result = await webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);

                if (result.MessageType == WebSocketMessageType.Text)
                {
                    var message = Encoding.UTF8.GetString(buffer, 0, result.Count);

                    // Optionally: save message to DB here

                    // Broadcast to all clients
                    var sendBuffer = Encoding.UTF8.GetBytes(message);
                    foreach (var client in _clients.Where(c => c.State == WebSocketState.Open))
                    {
                        await client.SendAsync(
                            new ArraySegment<byte>(sendBuffer),
                            WebSocketMessageType.Text,
                            true,
                            CancellationToken.None);
                    }
                }
                else if (result.MessageType == WebSocketMessageType.Close)
                {
                    _clients.Remove(webSocket);
                    await webSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Closing", CancellationToken.None);
                }
            }
        }
    }

}
