namespace backend.Models
{
    public class Course
    {
        public int Id { get; set; }
        public required string Name { get; set; }

        public List<ChatMessage> Messages { get; set; } = new List<ChatMessage>();

        // Navigation property for many-to-many relationship with users
        public List<User> Users { get; set; } = new List<User>();
    }

}
