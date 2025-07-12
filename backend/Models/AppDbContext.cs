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
        public DbSet<ChatMessageRead> ChatMessageReads { get; set; }
        public DbSet<Course> Courses { get; set; }
        public DbSet<StudyBuddy> StudyBuddies { get; set; }
        public DbSet<PrivateMessage> PrivateMessages { get; set; }


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

            // Add unique constraint for course names (case-insensitive)
            modelBuilder.Entity<Course>()
                .HasIndex(c => c.Name)
                .IsUnique();

            // Configure StudyBuddy relationships
            modelBuilder.Entity<StudyBuddy>()
                .HasOne(sb => sb.User)
                .WithMany()
                .HasForeignKey(sb => sb.UserId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<StudyBuddy>()
                .HasOne(sb => sb.Course)
                .WithMany()
                .HasForeignKey(sb => sb.CourseId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<StudyBuddy>()
                .HasOne(sb => sb.Buddy)
                .WithMany()
                .HasForeignKey(sb => sb.BuddyId)
                .OnDelete(DeleteBehavior.SetNull);

            // Ensure one study buddy record per user per course
            modelBuilder.Entity<StudyBuddy>()
                .HasIndex(sb => new { sb.UserId, sb.CourseId })
                .IsUnique();

            // Configure PrivateMessage relationships
            modelBuilder.Entity<PrivateMessage>()
                .HasOne(pm => pm.Sender)
                .WithMany()
                .HasForeignKey(pm => pm.SenderId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<PrivateMessage>()
                .HasOne(pm => pm.Recipient)
                .WithMany()
                .HasForeignKey(pm => pm.RecipientId)
                .OnDelete(DeleteBehavior.NoAction);

            // Configure ChatMessageRead relationships
            modelBuilder.Entity<ChatMessageRead>()
                .HasOne(cmr => cmr.Message)
                .WithMany()
                .HasForeignKey(cmr => cmr.MessageId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ChatMessageRead>()
                .HasOne(cmr => cmr.User)
                .WithMany()
                .HasForeignKey(cmr => cmr.UserId)
                .OnDelete(DeleteBehavior.NoAction);

            // Ensure one read record per user per message
            modelBuilder.Entity<ChatMessageRead>()
                .HasIndex(cmr => new { cmr.MessageId, cmr.UserId })
                .IsUnique();
        }
    }
}
