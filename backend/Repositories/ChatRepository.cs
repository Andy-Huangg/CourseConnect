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
                .Where(m => m.CourseId == courseId)
                .OrderBy(m => m.Timestamp)
                .ToListAsync();
        }

        public async Task AddMessageAsync(ChatMessage message)
        {
            _context.ChatMessages.Add(message);
            await _context.SaveChangesAsync();
        }
    }

}

