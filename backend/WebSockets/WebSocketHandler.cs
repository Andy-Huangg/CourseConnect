using System.Net.WebSockets;
using System.Text;
using System.Web;
using System.Security.Claims;
using backend.Repositories;
using backend.Models;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.IdentityModel.Tokens;

namespace backend.WebSockets
{
    public static class WebSocketHandler
    {
        private static readonly Dictionary<int, List<WebSocket>> _courseClients = new();

        private static int? GetUserIdFromToken(HttpContext context)
        {
            try
            {
                // First try to get token from query parameter (WebSocket connection)
                var query = context.Request.Query;
                string? token = null;

                if (query.TryGetValue("token", out var tokenFromQuery))
                {
                    token = tokenFromQuery.ToString();
                }
                // Fallback to Authorization header
                else if (context.Request.Headers.TryGetValue("Authorization", out var authHeader))
                {
                    var authHeaderValue = authHeader.ToString();
                    if (authHeaderValue.StartsWith("Bearer "))
                    {
                        token = authHeaderValue.Substring("Bearer ".Length);
                    }
                }

                if (string.IsNullOrEmpty(token))
                {
                    return null;
                }

                // Parse the JWT token
                var tokenHandler = new JwtSecurityTokenHandler();
                var jsonToken = tokenHandler.ReadJwtToken(token);

                // Extract user ID from NameIdentifier claim
                var userIdClaim = jsonToken.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier);
                if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int userId))
                {
                    return userId;
                }

                return null;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error extracting user ID from token: {ex.Message}");
                return null;
            }
        }

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

                    // Get user ID from our token parser
                    var userId = GetUserIdFromToken(context);
                    Console.WriteLine($"User ID: {userId}");

                    // Save message to DB with courseId
                    await chatRepository.AddMessageAsync(new ChatMessage
                    {
                        SenderId = userId?.ToString() ?? string.Empty,
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
