using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories
{
    public class PrivateMessageRepository : IPrivateMessageRepository
    {
        private readonly AppDbContext _context;

        public PrivateMessageRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<PrivateMessage> AddMessageAsync(PrivateMessage message)
        {
            _context.PrivateMessages.Add(message);
            await _context.SaveChangesAsync();

            // Load the related entities for the response
            await _context.Entry(message)
                .Reference(m => m.Sender)
                .LoadAsync();
            await _context.Entry(message)
                .Reference(m => m.Recipient)
                .LoadAsync();

            return message;
        }

        public async Task<IEnumerable<PrivateMessage>> GetMessagesBetweenUsersAsync(int userId1, int userId2, int skip = 0, int take = 50)
        {
            return await _context.PrivateMessages
                .Include(pm => pm.Sender)
                .Include(pm => pm.Recipient)
                .Where(pm =>
                    (pm.SenderId == userId1 && pm.RecipientId == userId2) ||
                    (pm.SenderId == userId2 && pm.RecipientId == userId1))
                .Where(pm => !pm.IsDeleted)
                .OrderByDescending(pm => pm.Timestamp)
                .Skip(skip)
                .Take(take)
                .ToListAsync();
        }

        public async Task<PrivateMessage?> GetMessageByIdAsync(int messageId)
        {
            return await _context.PrivateMessages
                .Include(pm => pm.Sender)
                .Include(pm => pm.Recipient)
                .FirstOrDefaultAsync(pm => pm.Id == messageId && !pm.IsDeleted);
        }

        public async Task<bool> UpdateMessageAsync(PrivateMessage message)
        {
            try
            {
                message.EditedAt = DateTime.UtcNow;
                _context.PrivateMessages.Update(message);
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> DeleteMessageAsync(int messageId)
        {
            try
            {
                var message = await _context.PrivateMessages.FindAsync(messageId);
                if (message == null) return false;

                message.IsDeleted = true;
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> MarkAsReadAsync(int messageId, int userId)
        {
            try
            {
                var message = await _context.PrivateMessages.FindAsync(messageId);
                if (message == null || message.RecipientId != userId) return false;

                message.ReadAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<int> GetUnreadCountAsync(int userId)
        {
            return await _context.PrivateMessages
                .CountAsync(pm => pm.RecipientId == userId && pm.ReadAt == null && !pm.IsDeleted);
        }

        public async Task<Dictionary<int, int>> GetUnreadCountsByUserAsync(int userId)
        {
            return await _context.PrivateMessages
                .Where(pm => pm.RecipientId == userId && pm.ReadAt == null && !pm.IsDeleted)
                .GroupBy(pm => pm.SenderId)
                .ToDictionaryAsync(g => g.Key, g => g.Count());
        }
    }
}
