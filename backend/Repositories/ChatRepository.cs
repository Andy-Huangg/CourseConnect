using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories
{
    public class ChatRepository : IChatRepository
    {
        private readonly AppDbContext _context;

        public ChatRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<ChatMessage>> GetMessagesByCourseIdAsync(int courseId)
        {
            return await _context.ChatMessages
                .Where(m => m.CourseId == courseId && !m.IsDeleted)
                .OrderBy(m => m.Timestamp)
                .ToListAsync();
        }

        public async Task AddMessageAsync(ChatMessage message)
        {
            _context.ChatMessages.Add(message);
            await _context.SaveChangesAsync();
        }

        public async Task<ChatMessage?> GetMessageByIdAsync(int messageId)
        {
            return await _context.ChatMessages
                .FirstOrDefaultAsync(m => m.Id == messageId && !m.IsDeleted);
        }

        public async Task UpdateMessageAsync(ChatMessage message)
        {
            _context.ChatMessages.Update(message);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteMessageAsync(int messageId)
        {
            var message = await GetMessageByIdAsync(messageId);
            if (message != null)
            {
                message.IsDeleted = true;
                await _context.SaveChangesAsync();
            }
        }

        public async Task MarkAllCourseMessagesAsReadAsync(int courseId, int userId)
        {
            // Get all unread messages in this course for this user
            var unreadMessages = await _context.ChatMessages
                .Where(m => m.CourseId == courseId &&
                           !m.IsDeleted &&
                           m.SenderId != userId.ToString() && // Don't mark own messages
                           !_context.ChatMessageReads.Any(cmr => cmr.MessageId == m.Id && cmr.UserId == userId))
                .Select(m => m.Id)
                .ToListAsync();

            if (unreadMessages.Any())
            {
                var messageReads = unreadMessages.Select(messageId => new ChatMessageRead
                {
                    MessageId = messageId,
                    UserId = userId,
                    ReadAt = DateTime.UtcNow
                }).ToList();

                _context.ChatMessageReads.AddRange(messageReads);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<bool> HasNewMessagesAsync(int courseId, int userId)
        {
            return await _context.ChatMessages
                .AnyAsync(m => m.CourseId == courseId &&
                              !m.IsDeleted &&
                              m.SenderId != userId.ToString() && // Don't count own messages
                              !_context.ChatMessageReads.Any(cmr => cmr.MessageId == m.Id && cmr.UserId == userId));
        }
    }

}

