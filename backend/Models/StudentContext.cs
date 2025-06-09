using Microsoft.EntityFrameworkCore;

namespace backend.Models
{
    public class StudentContext : DbContext
    {
        public StudentContext(DbContextOptions<StudentContext> options) : base(options)
        {
        }

        public DbSet<Student> Student { get; set; } = default!;
    }
}
