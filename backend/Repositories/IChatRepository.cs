using backend.Models;

namespace backend.Repositories
{
    public interface IChatRepository
    {
        Task<IEnumerable<ChatMessage>> GetMessagesByCourseIdAsync(int courseId);
        Task AddMessageAsync(ChatMessage message);
        Task<ChatMessage?> GetMessageByIdAsync(int messageId);
        Task UpdateMessageAsync(ChatMessage message);
        Task DeleteMessageAsync(int messageId);
        Task MarkAllCourseMessagesAsReadAsync(int courseId, int userId);
        Task<bool> HasNewMessagesAsync(int courseId, int userId);
    }

}
