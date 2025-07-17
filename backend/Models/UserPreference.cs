using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class UserPreference
    {
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }

        [Required]
        public required string PreferenceType { get; set; } // "courseOrder" or "studyBuddyOrder"

        [Required]
        public required string PreferenceValue { get; set; } // JSON string of ordered IDs

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation property
        public User User { get; set; } = null!;
    }
}
