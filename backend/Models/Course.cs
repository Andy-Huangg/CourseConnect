namespace backend.Models
{
    public class Course
    {
        public int Id { get; set; }
        public required string Name { get; set; }

        public List<ChatMessage> Messages { get; set; } = new List<ChatMessage>();
    }

}
