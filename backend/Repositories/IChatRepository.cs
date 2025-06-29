using backend.Models;

namespace backend.Repositories
{
    public interface IChatRepository
    {
        Task<IEnumerable<ChatMessage>> GetMessagesByCourseIdAsync(int courseId);
        Task AddMessageAsync(ChatMessage message);
    }

}
