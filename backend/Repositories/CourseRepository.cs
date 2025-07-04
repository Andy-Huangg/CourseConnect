using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories
{
    public class CourseRepository : ICourseRepository
    {
        private readonly AppDbContext _context;

        public CourseRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Course?> GetByIdAsync(int id)
        {
            return await _context.Courses.FirstOrDefaultAsync(c => c.Id == id);
        }

        public async Task<Course?> GetByNameAsync(string name)
        {
            // Normalize the name to prevent duplicates like "cs150", "CS150", "CS 150"
            var normalizedName = NormalizeName(name);
            return await _context.Courses.FirstOrDefaultAsync(c => c.Name.ToLower().Replace(" ", "") == normalizedName);
        }

        public async Task<IEnumerable<Course>> GetAllAsync()
        {
            return await _context.Courses.OrderBy(c => c.Name).ToListAsync();
        }

        public async Task<Course> CreateCourseAsync(string name)
        {
            // Normalize the name for comparison
            var normalizedName = NormalizeName(name);

            // Check if course already exists (case-insensitive, space-insensitive)
            var existingCourse = await GetByNameAsync(name);
            if (existingCourse != null)
            {
                return existingCourse;
            }

            // Create new course with the original name (but trimmed)
            var course = new Course
            {
                Name = name.Trim() // Keep original casing but trim whitespace
            };

            try
            {
                _context.Courses.Add(course);
                await _context.SaveChangesAsync();
                return course;
            }
            catch (DbUpdateException)
            {
                // If unique constraint violation occurs, try to get the existing course
                var conflictingCourse = await GetByNameAsync(name);
                if (conflictingCourse != null)
                {
                    return conflictingCourse;
                }
                throw; // Re-throw if it's a different error
            }
        }

        public async Task<bool> CourseExistsAsync(string name)
        {
            var normalizedName = NormalizeName(name);
            return await _context.Courses.AnyAsync(c => c.Name.ToLower().Replace(" ", "") == normalizedName);
        }

        // User enrollment methods
        public async Task<IEnumerable<Course>> GetCoursesByUserIdAsync(int userId)
        {
            // Use a direct query to avoid circular references
            return await _context.User
                .Where(u => u.Id == userId)
                .SelectMany(u => u.Courses)
                .Select(c => new Course { Id = c.Id, Name = c.Name })
                .ToListAsync();
        }

        public async Task<bool> EnrollUserAsync(int userId, int courseId)
        {
            // Check if user and course exist
            var userExists = await _context.User.AnyAsync(u => u.Id == userId);
            var courseExists = await _context.Courses.AnyAsync(c => c.Id == courseId);

            if (!userExists || !courseExists)
            {
                return false;
            }

            // Check if user is already enrolled
            var alreadyEnrolled = await _context.User
                .Where(u => u.Id == userId)
                .SelectMany(u => u.Courses)
                .AnyAsync(c => c.Id == courseId);

            if (alreadyEnrolled)
            {
                return true; // Already enrolled
            }

            // Load entities for the relationship
            var user = await _context.User.FindAsync(userId);
            var course = await _context.Courses.FindAsync(courseId);

            if (user != null && course != null)
            {
                // Load the courses collection for this user
                await _context.Entry(user)
                    .Collection(u => u.Courses)
                    .LoadAsync();

                user.Courses.Add(course);
                await _context.SaveChangesAsync();
                return true;
            }

            return false;
        }

        public async Task<bool> UnenrollUserAsync(int userId, int courseId)
        {
            // Load the user and their courses collection
            var user = await _context.User.FindAsync(userId);
            if (user == null)
            {
                return false;
            }

            // Load the courses collection for this user
            await _context.Entry(user)
                .Collection(u => u.Courses)
                .LoadAsync();

            var courseToRemove = user.Courses.FirstOrDefault(c => c.Id == courseId);
            if (courseToRemove != null)
            {
                user.Courses.Remove(courseToRemove);
                await _context.SaveChangesAsync();
            }

            return true;
        }

        public async Task<bool> IsUserEnrolledAsync(int userId, int courseId)
        {
            return await _context.User
                .Where(u => u.Id == userId)
                .SelectMany(u => u.Courses)
                .AnyAsync(c => c.Id == courseId);
        }

        private static string NormalizeName(string name)
        {
            // Convert to lowercase and remove all spaces for comparison
            return name.ToLower().Replace(" ", "");
        }
    }
}
