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
        private static readonly Dictionary<int, HashSet<int>> _courseUsers = new();

        private static async Task BroadcastUserCount(int courseId)
        {
            var userCount = _courseUsers.ContainsKey(courseId) ? _courseUsers[courseId].Count : 0;
            Console.WriteLine($"Broadcasting user count for course {courseId}: {userCount} users");
            var userCountMessage = $"USER_COUNT:{userCount}";
            var sendBuffer = Encoding.UTF8.GetBytes(userCountMessage);

            if (_courseClients.ContainsKey(courseId))
            {
                Console.WriteLine($"Sending to {_courseClients[courseId].Count} clients");
                foreach (var client in _courseClients[courseId].Where(c => c.State == WebSocketState.Open))
                {
                    try
                    {
                        await client.SendAsync(new ArraySegment<byte>(sendBuffer),
                                               WebSocketMessageType.Text,
                                               true,
                                               CancellationToken.None);
                    }
                    catch
                    {
                        // Ignore errors for disconnected clients
                    }
                }
            }
        }

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
                    Console.WriteLine("Token found in query parameter");
                }
                // Fallback to Authorization header
                else if (context.Request.Headers.TryGetValue("Authorization", out var authHeader))
                {
                    var authHeaderValue = authHeader.ToString();
                    if (authHeaderValue.StartsWith("Bearer "))
                    {
                        token = authHeaderValue.Substring("Bearer ".Length);
                        Console.WriteLine("Token found in Authorization header");
                    }
                }

                if (string.IsNullOrEmpty(token))
                {
                    Console.WriteLine("No token found in request");
                    return null;
                }

                // Parse the JWT token
                var tokenHandler = new JwtSecurityTokenHandler();
                var jsonToken = tokenHandler.ReadJwtToken(token);

                // Extract user ID from NameIdentifier claim
                var userIdClaim = jsonToken.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier);
                if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int userId))
                {
                    Console.WriteLine($"Successfully extracted user ID: {userId}");
                    return userId;
                }

                Console.WriteLine("User ID claim not found or invalid");
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
                Console.WriteLine("Error: Missing or invalid courseId");
                context.Response.StatusCode = 400;
                await context.Response.WriteAsync("Missing or invalid courseId");
                return;
            }

            var userId = GetUserIdFromToken(context);
            if (userId == null)
            {
                Console.WriteLine("Error: Invalid or missing authentication token");
                context.Response.StatusCode = 401;
                await context.Response.WriteAsync("Invalid or missing authentication token");
                return;
            }

            Console.WriteLine($"User {userId} connecting to course {courseId}");

            if (!_courseClients.ContainsKey(courseId.Value))
                _courseClients[courseId.Value] = new List<WebSocket>();

            if (!_courseUsers.ContainsKey(courseId.Value))
                _courseUsers[courseId.Value] = new HashSet<int>();

            _courseClients[courseId.Value].Add(webSocket);
            _courseUsers[courseId.Value].Add(userId.Value);

            Console.WriteLine($"Course {courseId} now has {_courseUsers[courseId.Value].Count} users");

            // Broadcast updated user count
            await BroadcastUserCount(courseId.Value);

            var buffer = new byte[1024 * 4];

            try
            {
                while (webSocket.State == WebSocketState.Open)
                {
                    var result = await webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);

                    if (result.MessageType == WebSocketMessageType.Text)
                    {
                        var message = Encoding.UTF8.GetString(buffer, 0, result.Count);

                        // Save message to DB with courseId
                        await chatRepository.AddMessageAsync(new ChatMessage
                        {
                            SenderId = userId?.ToString() ?? string.Empty,
                            Content = message,
                            Timestamp = DateTime.UtcNow,
                            CourseId = courseId.Value
                        });

                        // Format message with sender info for broadcasting
                        var formattedMessage = $"MESSAGE:{userId?.ToString() ?? "Anonymous"}: {message}";
                        var sendBuffer = Encoding.UTF8.GetBytes(formattedMessage);
                        foreach (var client in _courseClients[courseId.Value].Where(c => c.State == WebSocketState.Open))
                        {
                            try
                            {
                                await client.SendAsync(new ArraySegment<byte>(sendBuffer),
                                                       WebSocketMessageType.Text,
                                                       true,
                                                       CancellationToken.None);
                            }
                            catch
                            {
                                // Remove disconnected clients
                            }
                        }
                    }
                    else if (result.MessageType == WebSocketMessageType.Close)
                    {
                        break;
                    }
                }
            }
            finally
            {
                // Clean up when connection closes
                Console.WriteLine($"User {userId} disconnecting from course {courseId}");
                _courseClients[courseId.Value].Remove(webSocket);
                _courseUsers[courseId.Value].Remove(userId.Value);

                Console.WriteLine($"Course {courseId} now has {_courseUsers[courseId.Value].Count} users after disconnect");

                // Broadcast updated user count
                await BroadcastUserCount(courseId.Value);

                if (webSocket.State != WebSocketState.Closed)
                {
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
