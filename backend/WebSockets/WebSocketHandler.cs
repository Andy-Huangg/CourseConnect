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
        // Track which websocket belongs to which user for better cleanup
        private static readonly Dictionary<WebSocket, (int courseId, int userId)> _socketUserMap = new();

        private static async Task BroadcastUserCount(int courseId)
        {
            // Clean up disconnected clients before getting count
            CleanupClosedConnections(courseId);

            var userCount = _courseUsers.ContainsKey(courseId) ? _courseUsers[courseId].Count : 0;
            Console.WriteLine($"Broadcasting user count for course {courseId}: {userCount} users");
            var userCountMessage = $"USER_COUNT:{userCount}";
            var sendBuffer = Encoding.UTF8.GetBytes(userCountMessage);

            if (_courseClients.ContainsKey(courseId))
            {
                var openClients = _courseClients[courseId].Where(c => c.State == WebSocketState.Open).ToList();

                Console.WriteLine($"Sending to {openClients.Count} clients");
                foreach (var client in openClients)
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

        public static async Task HandleChatConnectionAsync(HttpContext context, WebSocket webSocket, IChatRepository chatRepository, ICourseRepository courseRepository)
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

            // Validate that the user is enrolled in the course
            var isEnrolled = await courseRepository.IsUserEnrolledAsync(userId.Value, courseId.Value);
            if (!isEnrolled)
            {
                Console.WriteLine($"Error: User {userId} is not enrolled in course {courseId}");
                context.Response.StatusCode = 403;
                await context.Response.WriteAsync("Access denied: You must be enrolled in this course to access the chat");
                return;
            }

            Console.WriteLine($"User {userId} connecting to course {courseId}");

            if (!_courseClients.ContainsKey(courseId.Value))
                _courseClients[courseId.Value] = new List<WebSocket>();

            if (!_courseUsers.ContainsKey(courseId.Value))
                _courseUsers[courseId.Value] = new HashSet<int>();

            // Clean up any closed connections for this course before adding new one
            CleanupClosedConnections(courseId.Value);

            // Debug logging for courseId 1 (Global)
            if (courseId.Value == 1)
            {
                Console.WriteLine($"[DEBUG] Global course - Before adding user {userId}:");
                Console.WriteLine($"[DEBUG] - Connected clients: {_courseClients[courseId.Value].Count}");
                Console.WriteLine($"[DEBUG] - Connected users: {string.Join(", ", _courseUsers[courseId.Value])}");
                Console.WriteLine($"[DEBUG] - Socket map entries for course 1: {_socketUserMap.Count(kvp => kvp.Value.courseId == 1)}");
            }

            _courseClients[courseId.Value].Add(webSocket);
            _courseUsers[courseId.Value].Add(userId.Value);

            // Track this websocket-user relationship
            _socketUserMap[webSocket] = (courseId.Value, userId.Value);

            // More debug logging for courseId 1
            if (courseId.Value == 1)
            {
                Console.WriteLine($"[DEBUG] Global course - After adding user {userId}:");
                Console.WriteLine($"[DEBUG] - Connected clients: {_courseClients[courseId.Value].Count}");
                Console.WriteLine($"[DEBUG] - Connected users: {string.Join(", ", _courseUsers[courseId.Value])}");
                Console.WriteLine($"[DEBUG] - Socket map entries for course 1: {_socketUserMap.Count(kvp => kvp.Value.courseId == 1)}");
            }

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

                // Debug logging for courseId 1 (Global)
                if (courseId.Value == 1)
                {
                    Console.WriteLine($"[DEBUG] Global course - Before cleanup for user {userId}:");
                    Console.WriteLine($"[DEBUG] - Connected clients: {(_courseClients.ContainsKey(courseId.Value) ? _courseClients[courseId.Value].Count : 0)}");
                    Console.WriteLine($"[DEBUG] - Connected users: {(_courseUsers.ContainsKey(courseId.Value) ? string.Join(", ", _courseUsers[courseId.Value]) : "none")}");
                    Console.WriteLine($"[DEBUG] - Socket map entries for course 1: {_socketUserMap.Count(kvp => kvp.Value.courseId == 1)}");
                }

                if (_courseClients.ContainsKey(courseId.Value))
                {
                    _courseClients[courseId.Value].Remove(webSocket);
                }

                // Remove from socket-user mapping and check if user should be removed
                if (_socketUserMap.TryGetValue(webSocket, out var userInfo))
                {
                    var (socketCourseId, socketUserId) = userInfo;
                    _socketUserMap.Remove(webSocket);

                    // Only remove user from course if they don't have any other open connections to this course
                    var userHasOtherConnections = _courseClients.ContainsKey(courseId.Value) &&
                        _courseClients[courseId.Value]
                            .Any(ws => _socketUserMap.TryGetValue(ws, out var info) &&
                                      info.userId == socketUserId && ws.State == WebSocketState.Open);

                    if (!userHasOtherConnections && _courseUsers.ContainsKey(courseId.Value))
                    {
                        _courseUsers[courseId.Value].Remove(socketUserId);
                    }

                    // Debug logging for courseId 1
                    if (courseId.Value == 1)
                    {
                        Console.WriteLine($"[DEBUG] Global course - User {socketUserId} other connections: {userHasOtherConnections}");
                    }
                }

                // More debug logging for courseId 1
                if (courseId.Value == 1)
                {
                    Console.WriteLine($"[DEBUG] Global course - After cleanup for user {userId}:");
                    Console.WriteLine($"[DEBUG] - Connected clients: {(_courseClients.ContainsKey(courseId.Value) ? _courseClients[courseId.Value].Count : 0)}");
                    Console.WriteLine($"[DEBUG] - Connected users: {(_courseUsers.ContainsKey(courseId.Value) ? string.Join(", ", _courseUsers[courseId.Value]) : "none")}");
                    Console.WriteLine($"[DEBUG] - Socket map entries for course 1: {_socketUserMap.Count(kvp => kvp.Value.courseId == 1)}");
                }

                Console.WriteLine($"Course {courseId} now has {(_courseUsers.ContainsKey(courseId.Value) ? _courseUsers[courseId.Value].Count : 0)} users after disconnect");

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

        private static void CleanupClosedConnections(int courseId)
        {
            if (!_courseClients.ContainsKey(courseId))
                return;

            var closedSockets = _courseClients[courseId]
                .Where(ws => ws.State != WebSocketState.Open)
                .ToList();

            foreach (var closedSocket in closedSockets)
            {
                _courseClients[courseId].Remove(closedSocket);

                // Remove user from course users if this was their socket
                if (_socketUserMap.TryGetValue(closedSocket, out var userInfo))
                {
                    var (socketCourseId, userId) = userInfo;
                    if (socketCourseId == courseId)
                    {
                        // Only remove user if they don't have any other open connections to this course
                        var userHasOtherConnections = _courseClients[courseId]
                            .Any(ws => _socketUserMap.TryGetValue(ws, out var info) &&
                                      info.userId == userId && ws.State == WebSocketState.Open);

                        if (!userHasOtherConnections && _courseUsers.ContainsKey(courseId))
                        {
                            _courseUsers[courseId].Remove(userId);
                        }
                    }
                    _socketUserMap.Remove(closedSocket);
                }
            }
        }
    }
}
