namespace backend.Models
{
    public class ChatMessage
    {
        public int Id { get; set; }

        public required string SenderId { get; set; } // User ID as string
        public required string DisplayName { get; set; } // Display name (real username or anonymous name)
        public required string Content { get; set; }
        public bool IsAnonymous { get; set; } = false; // Whether this message was sent anonymously

        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        // Link to Course Chat Room
        public int CourseId { get; set; }
        public Course? Course { get; set; }
    }
}
