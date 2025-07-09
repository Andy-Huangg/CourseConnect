using System.Net.WebSockets;
using System.Text;
using System.Web;
using System.Security.Claims;
using backend.Repositories;
using backend.Models;
using backend.Services;
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
        private static readonly object _lock = new object(); // Add thread safety

        private static async Task BroadcastUserCount(int courseId)
        {
            int userCount;
            List<WebSocket> openClients;

            lock (_lock)
            {
                // Clean up disconnected clients before getting count
                CleanupClosedConnections(courseId);

                userCount = _courseUsers.ContainsKey(courseId) ? _courseUsers[courseId].Count : 0;
                Console.WriteLine($"Broadcasting user count for course {courseId}: {userCount} users");

                openClients = _courseClients.ContainsKey(courseId)
                    ? _courseClients[courseId].Where(c => c.State == WebSocketState.Open).ToList()
                    : new List<WebSocket>();
            }

            var userCountMessage = $"USER_COUNT:{userCount}";
            var sendBuffer = Encoding.UTF8.GetBytes(userCountMessage);

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

                // Debug: Print all claims in the token
                Console.WriteLine("Available claims in token:");
                foreach (var claim in jsonToken.Claims)
                {
                    Console.WriteLine($"  {claim.Type}: {claim.Value}");
                }

                // Extract user ID from custom userId claim (preferred)
                var userIdClaim = jsonToken.Claims.FirstOrDefault(c => c.Type == "userId");
                if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int userId))
                {
                    Console.WriteLine($"Successfully extracted user ID from userId claim: {userId}");
                    return userId;
                }

                // Fallback to standard NameIdentifier claim (for backward compatibility)
                var nameIdentifierClaim = jsonToken.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier);
                if (nameIdentifierClaim != null && int.TryParse(nameIdentifierClaim.Value, out int fallbackUserId))
                {
                    Console.WriteLine($"Successfully extracted user ID from NameIdentifier claim: {fallbackUserId}");
                    return fallbackUserId;
                }

                Console.WriteLine("User ID claim not found or invalid in both userId and NameIdentifier claims");
                return null;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error extracting user ID from token: {ex.Message}");
                return null;
            }
        }

        public class ValidationResult
        {
            public bool IsValid { get; set; }
            public int StatusCode { get; set; }
            public string ErrorMessage { get; set; } = string.Empty;
        }

        public static async Task<ValidationResult> ValidateWebSocketConnectionAsync(HttpContext context, ICourseRepository courseRepository)
        {
            var courseId = GetCourseIdFromQuery(context);
            if (courseId == null)
            {
                Console.WriteLine("Error: Missing or invalid courseId");
                return new ValidationResult
                {
                    IsValid = false,
                    StatusCode = 400,
                    ErrorMessage = "Missing or invalid courseId"
                };
            }

            var userId = GetUserIdFromToken(context);
            if (userId == null)
            {
                Console.WriteLine("Error: Invalid or missing authentication token");
                return new ValidationResult
                {
                    IsValid = false,
                    StatusCode = 401,
                    ErrorMessage = "Invalid or missing authentication token"
                };
            }

            // Validate that the user is enrolled in the course
            var isEnrolled = await courseRepository.IsUserEnrolledAsync(userId.Value, courseId.Value);
            if (!isEnrolled)
            {
                Console.WriteLine($"Error: User {userId} is not enrolled in course {courseId}");
                return new ValidationResult
                {
                    IsValid = false,
                    StatusCode = 403,
                    ErrorMessage = "Access denied: You must be enrolled in this course to access the chat"
                };
            }

            return new ValidationResult { IsValid = true };
        }

        public static async Task BroadcastMessageUpdate(int courseId, ChatMessage message)
        {
            List<WebSocket> openClients;

            lock (_lock)
            {
                if (!_courseClients.ContainsKey(courseId))
                    return;

                openClients = _courseClients[courseId].Where(c => c.State == WebSocketState.Open).ToList();
            }

            var messageDto = new
            {
                id = message.Id,
                senderId = message.SenderId,
                displayName = message.DisplayName,
                content = message.Content,
                isAnonymous = message.IsAnonymous,
                timestamp = message.Timestamp.ToString("o"),
                courseId = message.CourseId,
                editedAt = message.EditedAt?.ToString("o"),
                isDeleted = message.IsDeleted
            };

            var jsonMessage = System.Text.Json.JsonSerializer.Serialize(messageDto);
            var formattedMessage = $"MESSAGE_UPDATED:{jsonMessage}";
            var sendBuffer = Encoding.UTF8.GetBytes(formattedMessage);

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

        public static async Task BroadcastMessageDelete(int courseId, int messageId)
        {
            List<WebSocket> openClients;

            lock (_lock)
            {
                if (!_courseClients.ContainsKey(courseId))
                    return;

                openClients = _courseClients[courseId].Where(c => c.State == WebSocketState.Open).ToList();
            }

            var formattedMessage = $"MESSAGE_DELETED:{messageId}";
            var sendBuffer = Encoding.UTF8.GetBytes(formattedMessage);

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

        public static async Task HandleChatConnectionAsync(HttpContext context, WebSocket webSocket, IChatRepository chatRepository, ICourseRepository courseRepository, IAnonymousNameService anonymousNameService, IUserRepository userRepository)
        {
            // Validation is already done before this method is called
            var courseId = GetCourseIdFromQuery(context)!.Value; // We know it's valid
            var userId = GetUserIdFromToken(context)!.Value; // We know it's valid

            // Get anonymous mode from query parameters
            var isAnonymousMode = GetAnonymousModeFromQuery(context);

            Console.WriteLine($"User {userId} connecting to course {courseId} (anonymous: {isAnonymousMode})");

            lock (_lock)
            {
                if (!_courseClients.ContainsKey(courseId))
                    _courseClients[courseId] = new List<WebSocket>();

                if (!_courseUsers.ContainsKey(courseId))
                    _courseUsers[courseId] = new HashSet<int>();

                // Clean up any closed connections for this course before adding new one
                CleanupClosedConnections(courseId);

                // Debug logging for courseId 1 (Global)
                if (courseId == 1)
                {
                    Console.WriteLine($"[DEBUG] Global course - Before adding user {userId}:");
                    Console.WriteLine($"[DEBUG] - Connected clients: {_courseClients[courseId].Count}");
                    Console.WriteLine($"[DEBUG] - Connected users: {string.Join(", ", _courseUsers[courseId])}");
                    Console.WriteLine($"[DEBUG] - Socket map entries for course 1: {_socketUserMap.Count(kvp => kvp.Value.courseId == 1)}");
                }

                _courseClients[courseId].Add(webSocket);
                _courseUsers[courseId].Add(userId);

                // Track this websocket-user relationship
                _socketUserMap[webSocket] = (courseId, userId);

                // More debug logging for courseId 1
                if (courseId == 1)
                {
                    Console.WriteLine($"[DEBUG] Global course - After adding user {userId}:");
                    Console.WriteLine($"[DEBUG] - Connected clients: {_courseClients[courseId].Count}");
                    Console.WriteLine($"[DEBUG] - Connected users: {string.Join(", ", _courseUsers[courseId])}");
                    Console.WriteLine($"[DEBUG] - Socket map entries for course 1: {_socketUserMap.Count(kvp => kvp.Value.courseId == 1)}");
                }

                Console.WriteLine($"Course {courseId} now has {_courseUsers[courseId].Count} users");
            }

            // Broadcast updated user count
            await BroadcastUserCount(courseId);

            var buffer = new byte[1024 * 4];

            try
            {
                while (webSocket.State == WebSocketState.Open)
                {
                    var result = await webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);

                    if (result.MessageType == WebSocketMessageType.Text)
                    {
                        var message = Encoding.UTF8.GetString(buffer, 0, result.Count);

                        // Determine display name based on anonymous mode
                        string displayName;
                        if (isAnonymousMode)
                        {
                            displayName = anonymousNameService.GenerateAnonymousName(userId, courseId);
                        }
                        else
                        {
                            // Get the real username from the database
                            var user = await userRepository.GetByIdAsync(userId);
                            displayName = user?.DisplayName ?? $"User{userId}";
                        }

                        // Save message to DB with courseId
                        var chatMessage = new ChatMessage
                        {
                            SenderId = userId.ToString(),
                            DisplayName = displayName,
                            Content = message,
                            IsAnonymous = isAnonymousMode,
                            Timestamp = DateTime.UtcNow,
                            CourseId = courseId
                        };

                        await chatRepository.AddMessageAsync(chatMessage);

                        // Send the complete message object as JSON for real-time updates
                        var messageDto = new
                        {
                            id = chatMessage.Id,
                            senderId = chatMessage.SenderId,
                            displayName = chatMessage.DisplayName,
                            content = chatMessage.Content,
                            isAnonymous = chatMessage.IsAnonymous,
                            timestamp = chatMessage.Timestamp.ToString("o"), // ISO format
                            courseId = chatMessage.CourseId,
                            editedAt = (string?)null,
                            isDeleted = false
                        };

                        var jsonMessage = System.Text.Json.JsonSerializer.Serialize(messageDto);
                        var formattedMessage = $"NEW_MESSAGE:{jsonMessage}";
                        var sendBuffer = Encoding.UTF8.GetBytes(formattedMessage);

                        List<WebSocket> openClients;
                        lock (_lock)
                        {
                            openClients = _courseClients.ContainsKey(courseId)
                                ? _courseClients[courseId].Where(c => c.State == WebSocketState.Open).ToList()
                                : new List<WebSocket>();
                        }

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

                lock (_lock)
                {
                    // Debug logging for courseId 1 (Global)
                    if (courseId == 1)
                    {
                        Console.WriteLine($"[DEBUG] Global course - Before cleanup for user {userId}:");
                        Console.WriteLine($"[DEBUG] - Connected clients: {(_courseClients.ContainsKey(courseId) ? _courseClients[courseId].Count : 0)}");
                        Console.WriteLine($"[DEBUG] - Connected users: {(_courseUsers.ContainsKey(courseId) ? string.Join(", ", _courseUsers[courseId]) : "none")}");
                        Console.WriteLine($"[DEBUG] - Socket map entries for course 1: {_socketUserMap.Count(kvp => kvp.Value.courseId == 1)}");
                    }

                    if (_courseClients.ContainsKey(courseId))
                    {
                        _courseClients[courseId].Remove(webSocket);
                    }

                    // Remove from socket-user mapping and check if user should be removed
                    if (_socketUserMap.TryGetValue(webSocket, out var userInfo))
                    {
                        var (socketCourseId, socketUserId) = userInfo;
                        _socketUserMap.Remove(webSocket);

                        // Only remove user from course if they don't have any other open connections to this course
                        var userHasOtherConnections = _courseClients.ContainsKey(courseId) &&
                            _courseClients[courseId]
                                .Any(ws => _socketUserMap.TryGetValue(ws, out var info) &&
                                          info.userId == socketUserId && ws.State == WebSocketState.Open);

                        if (!userHasOtherConnections && _courseUsers.ContainsKey(courseId))
                        {
                            _courseUsers[courseId].Remove(socketUserId);
                        }

                        // Debug logging for courseId 1
                        if (courseId == 1)
                        {
                            Console.WriteLine($"[DEBUG] Global course - User {socketUserId} other connections: {userHasOtherConnections}");
                        }
                    }

                    // More debug logging for courseId 1
                    if (courseId == 1)
                    {
                        Console.WriteLine($"[DEBUG] Global course - After cleanup for user {userId}:");
                        Console.WriteLine($"[DEBUG] - Connected clients: {(_courseClients.ContainsKey(courseId) ? _courseClients[courseId].Count : 0)}");
                        Console.WriteLine($"[DEBUG] - Connected users: {(_courseUsers.ContainsKey(courseId) ? string.Join(", ", _courseUsers[courseId]) : "none")}");
                        Console.WriteLine($"[DEBUG] - Socket map entries for course 1: {_socketUserMap.Count(kvp => kvp.Value.courseId == 1)}");
                    }

                    Console.WriteLine($"Course {courseId} now has {(_courseUsers.ContainsKey(courseId) ? _courseUsers[courseId].Count : 0)} users after disconnect");
                }

                // Broadcast updated user count
                await BroadcastUserCount(courseId);

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

        private static bool GetAnonymousModeFromQuery(HttpContext context)
        {
            var query = context.Request.Query;
            if (query.TryGetValue("anonymous", out var anonymousStr) &&
                bool.TryParse(anonymousStr, out bool isAnonymous))
            {
                return isAnonymous;
            }

            return false; // Default to non-anonymous
        }

        private static void CleanupClosedConnections(int courseId)
        {
            // This method should only be called from within a lock
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

        public static async Task BroadcastStudyBuddyUpdate(int userId, int courseId, string updateType, StudyBuddy? studyBuddy = null)
        {
            var message = new
            {
                type = "STUDY_BUDDY_UPDATE",
                userId = userId,
                courseId = courseId,
                updateType = updateType, // "MATCHED", "DISCONNECTED", "OPTED_IN", "OPTED_OUT"
                studyBuddy = studyBuddy != null ? new
                {
                    id = studyBuddy.Id,
                    courseId = studyBuddy.CourseId,
                    isOptedIn = studyBuddy.IsOptedIn,
                    buddy = studyBuddy.Buddy != null ? new
                    {
                        id = studyBuddy.Buddy.Id,
                        username = studyBuddy.Buddy.Username,
                        displayName = studyBuddy.Buddy.DisplayName
                    } : null,
                    matchedAt = studyBuddy.MatchedAt,
                    contactPreference = studyBuddy.ContactPreference
                } : null
            };

            var jsonMessage = System.Text.Json.JsonSerializer.Serialize(message);
            var sendBuffer = Encoding.UTF8.GetBytes(jsonMessage);

            List<WebSocket> openClients;

            lock (_lock)
            {
                // Send to all users connected to the Global course (courseId 1) 
                // since that's where StudyBuddy components listen for updates
                const int globalCourseId = 1;
                openClients = _courseClients.ContainsKey(globalCourseId)
                    ? _courseClients[globalCourseId].Where(c => c.State == WebSocketState.Open).ToList()
                    : new List<WebSocket>();
            }

            Console.WriteLine($"Broadcasting study buddy update to {openClients.Count} clients on Global course");

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

        // Private Message WebSocket Broadcasting Methods
        public static async Task BroadcastPrivateMessage(int senderId, int recipientId, PrivateMessage message)
        {
            var messageData = new
            {
                type = "PRIVATE_MESSAGE_NEW",
                message = new
                {
                    id = message.Id,
                    senderId = message.SenderId,
                    senderName = message.Sender.DisplayName,
                    recipientId = message.RecipientId,
                    recipientName = message.Recipient.DisplayName,
                    content = message.Content,
                    timestamp = message.Timestamp.ToString("o"),
                    editedAt = message.EditedAt?.ToString("o"),
                    isRead = message.ReadAt.HasValue
                }
            };

            // Send to both sender and recipient
            await BroadcastToUser(senderId, messageData);
            await BroadcastToUser(recipientId, messageData);
        }

        public static async Task BroadcastPrivateMessageUpdate(int senderId, int recipientId, PrivateMessage message)
        {
            var updateData = new
            {
                type = "PRIVATE_MESSAGE_UPDATED",
                message = new
                {
                    id = message.Id,
                    senderId = message.SenderId,
                    senderName = message.Sender.DisplayName,
                    recipientId = message.RecipientId,
                    recipientName = message.Recipient.DisplayName,
                    content = message.Content,
                    timestamp = message.Timestamp.ToString("o"),
                    editedAt = message.EditedAt?.ToString("o"),
                    isRead = message.ReadAt.HasValue
                }
            };

            // Send to both sender and recipient
            await BroadcastToUser(senderId, updateData);
            await BroadcastToUser(recipientId, updateData);
        }

        public static async Task BroadcastPrivateMessageDelete(int senderId, int recipientId, int messageId)
        {
            var deleteData = new
            {
                type = "PRIVATE_MESSAGE_DELETED",
                messageId = messageId
            };

            // Send to both sender and recipient
            await BroadcastToUser(senderId, deleteData);
            await BroadcastToUser(recipientId, deleteData);
        }

        public static async Task BroadcastPrivateMessageRead(int senderId, int messageId)
        {
            var readData = new
            {
                type = "PRIVATE_MESSAGE_READ",
                messageId = messageId
            };

            // Send to sender to update their UI
            await BroadcastToUser(senderId, readData);
        }

        private static async Task BroadcastToUser(int userId, object data)
        {
            var jsonMessage = System.Text.Json.JsonSerializer.Serialize(data);
            var sendBuffer = Encoding.UTF8.GetBytes(jsonMessage);

            // Find all WebSocket connections for this user across all courses
            List<WebSocket> userConnections;

            lock (_lock)
            {
                userConnections = new List<WebSocket>();

                foreach (var courseClients in _courseClients.Values)
                {
                    foreach (var client in courseClients.Where(c => c.State == WebSocketState.Open))
                    {
                        if (_socketUserMap.TryGetValue(client, out var userInfo) && userInfo.userId == userId)
                        {
                            userConnections.Add(client);
                        }
                    }
                }
            }

            Console.WriteLine($"Broadcasting private message update to user {userId} on {userConnections.Count} connections");

            foreach (var client in userConnections)
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
}
