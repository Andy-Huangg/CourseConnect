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

        private static string NormalizeName(string name)
        {
            // Convert to lowercase and remove all spaces for comparison
            return name.ToLower().Replace(" ", "");
        }
    }
}
