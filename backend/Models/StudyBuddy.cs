using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class StudyBuddy
    {
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }
        public User User { get; set; } = null!;

        [Required]
        public int CourseId { get; set; }
        public Course Course { get; set; } = null!;

        public int? BuddyId { get; set; }
        public User? Buddy { get; set; }

        [Required]
        public bool IsOptedIn { get; set; } = true;

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? MatchedAt { get; set; }

        // Optional: Contact preference or additional info
        public string? ContactPreference { get; set; }
    }
}
