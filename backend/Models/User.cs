using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class User
    {
        public int Id { get; set; }

        [Required]
        public required string Username { get; set; }

        [Required]
        public required string PasswordHash { get; set; }

        private string? _displayName;

        [Required]
        public string DisplayName
        {
            get => _displayName ?? Username; // Return Username if DisplayName is not set
            set => _displayName = value;    // Allow explicit setting of DisplayName
        }

        // Navigation property for many-to-many relationship with courses
        public List<Course> Courses { get; set; } = new List<Course>();
    }
}