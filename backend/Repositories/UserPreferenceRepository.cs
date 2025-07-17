using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories
{
    public class UserPreferenceRepository : IUserPreferenceRepository
    {
        private readonly AppDbContext _context;

        public UserPreferenceRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<UserPreference?> GetUserPreferenceAsync(int userId, string preferenceType)
        {
            return await _context.UserPreferences
                .FirstOrDefaultAsync(up => up.UserId == userId && up.PreferenceType == preferenceType);
        }

        public async Task<UserPreference> CreateOrUpdateUserPreferenceAsync(int userId, string preferenceType, string preferenceValue)
        {
            var existingPreference = await GetUserPreferenceAsync(userId, preferenceType);

            if (existingPreference != null)
            {
                existingPreference.PreferenceValue = preferenceValue;
                existingPreference.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                return existingPreference;
            }

            var newPreference = new UserPreference
            {
                UserId = userId,
                PreferenceType = preferenceType,
                PreferenceValue = preferenceValue
            };

            _context.UserPreferences.Add(newPreference);
            await _context.SaveChangesAsync();
            return newPreference;
        }
    }
}
