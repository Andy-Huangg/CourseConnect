using System.Net.WebSockets;
using System.Text;
using System.Web;
using backend.Repositories;
using backend.Models;

namespace backend.WebSockets
{
    public static class WebSocketHandler
    {
        private static readonly Dictionary<int, List<WebSocket>> _courseClients = new();

        public static async Task HandleChatConnectionAsync(HttpContext context, WebSocket webSocket, IChatRepository chatRepository)
        {
            var courseId = GetCourseIdFromQuery(context);
            if (courseId == null)
            {
                context.Response.StatusCode = 400;
                await context.Response.WriteAsync("Missing or invalid courseId");
                return;
            }

            if (!_courseClients.ContainsKey(courseId.Value))
                _courseClients[courseId.Value] = new List<WebSocket>();

            _courseClients[courseId.Value].Add(webSocket);

            var buffer = new byte[1024 * 4];

            while (webSocket.State == WebSocketState.Open)
            {
                var result = await webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);

                if (result.MessageType == WebSocketMessageType.Text)
                {
                    var message = Encoding.UTF8.GetString(buffer, 0, result.Count);

                    // Get user ID from JWT claims
                    var userId = context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "Anonymous";

                    // Save message to DB with courseId
                    await chatRepository.AddMessageAsync(new ChatMessage
                    {
                        SenderId = userId,
                        Content = message,
                        Timestamp = DateTime.UtcNow,
                        CourseId = courseId.Value
                    });

                    var sendBuffer = Encoding.UTF8.GetBytes(message);
                    foreach (var client in _courseClients[courseId.Value].Where(c => c.State == WebSocketState.Open))
                    {
                        await client.SendAsync(new ArraySegment<byte>(sendBuffer),
                                               WebSocketMessageType.Text,
                                               true,
                                               CancellationToken.None);
                    }
                }
                else if (result.MessageType == WebSocketMessageType.Close)
                {
                    _courseClients[courseId.Value].Remove(webSocket);
                    await webSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Closed", CancellationToken.None);
                }
            }
        }

        private static int? GetCourseIdFromQuery(HttpContext context)
        {
            var query = context.Request.Query;
            if (query.TryGetValue("courseId", out var courseIdStr) &&
                int.TryParse(courseIdStr, out int courseId))
            {
                return courseId;
            }

            return null;
        }
    }
}
