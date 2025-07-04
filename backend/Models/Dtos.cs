namespace backend.Models
{
    public class CourseDto
    {
        public int Id { get; set; }
        public required string Name { get; set; }
    }

    public class UserDto
    {
        public int Id { get; set; }
        public required string Username { get; set; }
        public required string DisplayName { get; set; }
    }
}
