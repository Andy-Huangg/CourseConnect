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
        Task MarkAllMessagesFromUserAsReadAsync(int fromUserId, int toUserId);
        Task<bool> HasNewMessagesFromUserAsync(int fromUserId, int toUserId);
    }
}
