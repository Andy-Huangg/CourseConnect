namespace backend.Models
{
    public class ChatMessageRead
    {
        public int Id { get; set; }
        public int MessageId { get; set; }
        public ChatMessage? Message { get; set; }
        public int UserId { get; set; }
        public User? User { get; set; }
        public DateTime ReadAt { get; set; } = DateTime.UtcNow;
    }
}
