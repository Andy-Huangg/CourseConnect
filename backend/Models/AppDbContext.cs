using Microsoft.EntityFrameworkCore;

namespace backend.Models
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<User> User { get; set; }
        public DbSet<Student> Student { get; set; } = default!;
        public DbSet<ChatMessage> ChatMessages { get; set; }
        public DbSet<Course> Courses { get; set; }


        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.Entity<Course>()
                .HasMany(c => c.Messages)
                .WithOne(m => m.Course)
                .HasForeignKey(m => m.CourseId);
        }
    }
}
