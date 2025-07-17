using backend.Models;

namespace backend.Repositories
{
    public interface IUserPreferenceRepository
    {
        Task<UserPreference?> GetUserPreferenceAsync(int userId, string preferenceType);
        Task<UserPreference> CreateOrUpdateUserPreferenceAsync(int userId, string preferenceType, string preferenceValue);
    }
}
