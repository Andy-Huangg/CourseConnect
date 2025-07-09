using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class PrivateMessage
    {
        public int Id { get; set; }

        [Required]
        public int SenderId { get; set; }
        public User Sender { get; set; } = null!;

        [Required]
        public int RecipientId { get; set; }
        public User Recipient { get; set; } = null!;

        [Required]
        public string Content { get; set; } = string.Empty;

        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public DateTime? EditedAt { get; set; }
        public bool IsDeleted { get; set; } = false;
        public DateTime? ReadAt { get; set; } // When the message was read by recipient
    }
}
