namespace backend.Models
{
    public class CourseDto
    {
        public int Id { get; set; }
        public required string Name { get; set; }
        public int UserCount { get; set; }
    }

    public class UserDto
    {
        public int Id { get; set; }
        public required string Username { get; set; }
        public required string DisplayName { get; set; }
    }

    public class EditMessageDto
    {
        public required string Content { get; set; }
    }

    public class MessageActionResponseDto
    {
        public bool Success { get; set; }
        public string? Message { get; set; }
    }

    public class StudyBuddyDto
    {
        public int Id { get; set; }
        public int CourseId { get; set; }
        public string CourseName { get; set; } = string.Empty;
        public bool IsOptedIn { get; set; }
        public StudyBuddyUserDto? Buddy { get; set; }
        public DateTime? MatchedAt { get; set; }
        public string? ContactPreference { get; set; }
    }

    public class StudyBuddyUserDto
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
    }

    public class OptInStudyBuddyDto
    {
        public int CourseId { get; set; }
        public bool IsOptedIn { get; set; }
        public string? ContactPreference { get; set; }
    }
}
