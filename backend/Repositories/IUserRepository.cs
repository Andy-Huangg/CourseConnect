using backend.Models;

namespace backend.Repositories
{
    public interface IUserRepository
    {
        Task<User?> GetByUsernameAsync(string username);
        Task<User?> GetByIdAsync(int id);
        Task<bool> UsernameExistsAsync(string username);
        Task<User?> UpdateDisplayNameAsync(int userId, string displayName);
    }
}