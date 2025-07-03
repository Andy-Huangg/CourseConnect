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
    }
}
