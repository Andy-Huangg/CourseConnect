namespace backend.Models
{
    public class ChatMessage
    {
        public int Id { get; set; }

        public string SenderId { get; set; } // or SenderName, if anonymous
        public string Content { get; set; }

        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        // Link to Course Chat Room
        public int CourseId { get; set; }
        public Course Course { get; set; }
    }
}
