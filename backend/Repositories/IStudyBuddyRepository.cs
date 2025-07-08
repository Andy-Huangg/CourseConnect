using backend.Models;

namespace backend.Repositories
{
    public interface IStudyBuddyRepository
    {
        Task<StudyBuddy?> GetByUserAndCourseAsync(int userId, int courseId);
        Task<IEnumerable<StudyBuddy>> GetByUserIdAsync(int userId);
        Task<StudyBuddy> OptInAsync(int userId, int courseId, string? contactPreference = null);
        Task<bool> OptOutAsync(int userId, int courseId);
        Task<StudyBuddy?> FindMatchAsync(int userId, int courseId);
        Task<bool> CreateMatchAsync(int userId1, int courseId, int userId2);
        Task<bool> RemoveMatchAsync(int userId, int courseId);
        Task<IEnumerable<StudyBuddy>> GetUnmatchedUsersForCourseAsync(int courseId, int excludeUserId);
    }
}
