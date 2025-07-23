using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories
{
    public class UserRepository : IUserRepository
    {
        private readonly AppDbContext _context;

        public UserRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<User?> GetByUsernameAsync(string username)
        {
            return await _context.User.FirstOrDefaultAsync(u => u.Username == username);
        }

        public async Task<User?> GetByIdAsync(int id)
        {
            return await _context.User.FirstOrDefaultAsync(u => u.Id == id);
        }

        public async Task<bool> UsernameExistsAsync(string username)
        {
            return await _context.User.AnyAsync(u => u.Username == username);
        }

        public async Task<User?> UpdateDisplayNameAsync(int userId, string displayName)
        {
            var user = await _context.User.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
            {
                return null;
            }

            user.DisplayName = displayName;
            await _context.SaveChangesAsync();
            return user;
        }

        public async Task<bool> DeleteUserAsync(int userId)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var user = await _context.User.FirstOrDefaultAsync(u => u.Id == userId);
                if (user == null)
                {
                    return false;
                }

                // Delete all related data manually due to SQL Server cascade limitations

                // 1. Delete all study buddy records where user is involved
                var studyBuddies = await _context.StudyBuddies
                    .Where(sb => sb.UserId == userId || sb.BuddyId == userId)
                    .ToListAsync();
                _context.StudyBuddies.RemoveRange(studyBuddies);

                // 2. Delete all private messages sent or received by the user
                var privateMessages = await _context.PrivateMessages
                    .Where(pm => pm.SenderId == userId || pm.RecipientId == userId)
                    .ToListAsync();
                _context.PrivateMessages.RemoveRange(privateMessages);

                // 3. Delete all chat message reads by the user
                var chatMessageReads = await _context.ChatMessageReads
                    .Where(cmr => cmr.UserId == userId)
                    .ToListAsync();
                _context.ChatMessageReads.RemoveRange(chatMessageReads);

                // 4. Delete all user preferences (should cascade automatically)
                var userPreferences = await _context.UserPreferences
                    .Where(up => up.UserId == userId)
                    .ToListAsync();
                _context.UserPreferences.RemoveRange(userPreferences);

                // 5. Remove user from all courses (many-to-many relationship)
                await _context.Entry(user)
                    .Collection(u => u.Courses)
                    .LoadAsync();
                user.Courses.Clear();

                // 6. Finally, delete the user
                _context.User.Remove(user);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                return true;
            }
            catch
            {
                await transaction.RollbackAsync();
                return false;
            }
        }
    }
}