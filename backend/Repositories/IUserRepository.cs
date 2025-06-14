using backend.Models;

namespace backend.Repositories
{
    public interface IUserRepository
    {
        Task<User?> GetByUsernameAsync(string username);
        Task AddUserAsync(User user);
        Task<bool> UsernameExistsAsync(string username);
    }
}