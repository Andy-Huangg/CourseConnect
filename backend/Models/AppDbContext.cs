using Microsoft.EntityFrameworkCore;

namespace backend.Models
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<User> User { get; set; }
        public DbSet<ChatMessage> ChatMessages { get; set; }
        public DbSet<Course> Courses { get; set; }


        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure Course -> ChatMessage one-to-many relationship
            modelBuilder.Entity<Course>()
                .HasMany(c => c.Messages)
                .WithOne(m => m.Course)
                .HasForeignKey(m => m.CourseId);

            // Configure User -> Course many-to-many relationship
            modelBuilder.Entity<User>()
                .HasMany(u => u.Courses)
                .WithMany(c => c.Users)
                .UsingEntity(j => j.ToTable("UserCourses"));
        }
    }
}
