using backend.Models;

namespace backend.Repositories
{
    public interface ICourseRepository
    {
        Task<Course?> GetByIdAsync(int id);
        Task<Course?> GetByNameAsync(string name);
        Task<IEnumerable<Course>> GetAllAsync();
        Task<Course> CreateCourseAsync(string name);
        Task<bool> CourseExistsAsync(string name);
        
        // User enrollment methods
        Task<IEnumerable<Course>> GetCoursesByUserIdAsync(int userId);
        Task<bool> EnrollUserAsync(int userId, int courseId);
        Task<bool> UnenrollUserAsync(int userId, int courseId);
        Task<bool> IsUserEnrolledAsync(int userId, int courseId);
    }
}
