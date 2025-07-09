using backend.Models;

namespace backend.Repositories
{
    public interface IPrivateMessageRepository
    {
        Task<PrivateMessage> AddMessageAsync(PrivateMessage message);
        Task<IEnumerable<PrivateMessage>> GetMessagesBetweenUsersAsync(int userId1, int userId2, int skip = 0, int take = 50);
        Task<PrivateMessage?> GetMessageByIdAsync(int messageId);
        Task<bool> UpdateMessageAsync(PrivateMessage message);
        Task<bool> DeleteMessageAsync(int messageId);
        Task<bool> MarkAsReadAsync(int messageId, int userId);
        Task<int> GetUnreadCountAsync(int userId);
        Task<Dictionary<int, int>> GetUnreadCountsByUserAsync(int userId);
    }
}
