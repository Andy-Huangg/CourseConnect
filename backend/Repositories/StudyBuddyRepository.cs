using backend.Models;
using Microsoft.EntityFrameworkCore;
using backend.WebSockets;

namespace backend.Repositories
{
    public class StudyBuddyRepository : IStudyBuddyRepository
    {
        private readonly AppDbContext _context;

        public StudyBuddyRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<StudyBuddy?> GetByUserAndCourseAsync(int userId, int courseId)
        {
            return await _context.StudyBuddies
                .Include(sb => sb.User)
                .Include(sb => sb.Course)
                .Include(sb => sb.Buddy)
                .FirstOrDefaultAsync(sb => sb.UserId == userId && sb.CourseId == courseId);
        }

        public async Task<IEnumerable<StudyBuddy>> GetByUserIdAsync(int userId)
        {
            return await _context.StudyBuddies
                .Include(sb => sb.User)
                .Include(sb => sb.Course)
                .Include(sb => sb.Buddy)
                .Where(sb => sb.UserId == userId)
                .ToListAsync();
        }

        public async Task<StudyBuddy> OptInAsync(int userId, int courseId, string? contactPreference = null)
        {
            // Check if user is enrolled in the course
            var isEnrolled = await _context.User
                .Where(u => u.Id == userId)
                .SelectMany(u => u.Courses)
                .AnyAsync(c => c.Id == courseId);

            if (!isEnrolled)
            {
                throw new InvalidOperationException("User must be enrolled in the course to opt in for study buddy.");
            }

            var existingRecord = await GetByUserAndCourseAsync(userId, courseId);

            if (existingRecord != null)
            {
                // Update existing record
                existingRecord.IsOptedIn = true;
                existingRecord.ContactPreference = contactPreference;
                existingRecord.CreatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                // Try to find a match when opting back in
                await TryCreateMatchAsync(existingRecord);

                // Reload the entity to get the updated buddy information with all includes
                await _context.Entry(existingRecord)
                    .Reference(sb => sb.Course)
                    .LoadAsync();
                await _context.Entry(existingRecord)
                    .Reference(sb => sb.Buddy)
                    .LoadAsync();

                // Broadcast opt-in update
                await WebSocketHandler.BroadcastStudyBuddyUpdate(userId, courseId, "OPTED_IN", existingRecord);

                return existingRecord;
            }
            else
            {
                // Create new record
                var studyBuddy = new StudyBuddy
                {
                    UserId = userId,
                    CourseId = courseId,
                    IsOptedIn = true,
                    ContactPreference = contactPreference,
                    CreatedAt = DateTime.UtcNow
                };

                _context.StudyBuddies.Add(studyBuddy);
                await _context.SaveChangesAsync();

                // Try to find a match immediately
                await TryCreateMatchAsync(studyBuddy);

                // Reload the entity to get the updated buddy information with all includes
                await _context.Entry(studyBuddy)
                    .Reference(sb => sb.Course)
                    .LoadAsync();
                await _context.Entry(studyBuddy)
                    .Reference(sb => sb.Buddy)
                    .LoadAsync();

                // Broadcast opt-in update
                await WebSocketHandler.BroadcastStudyBuddyUpdate(userId, courseId, "OPTED_IN", studyBuddy);

                return studyBuddy;
            }
        }

        public async Task<bool> OptOutAsync(int userId, int courseId)
        {
            var studyBuddy = await GetByUserAndCourseAsync(userId, courseId);
            if (studyBuddy == null) return false;

            // If user has a buddy, break the connection
            if (studyBuddy.BuddyId.HasValue)
            {
                await RemoveMatchAsync(userId, courseId);
            }

            studyBuddy.IsOptedIn = false;
            studyBuddy.BuddyId = null;
            studyBuddy.MatchedAt = null;

            await _context.SaveChangesAsync();

            // Broadcast opt-out update
            await WebSocketHandler.BroadcastStudyBuddyUpdate(userId, courseId, "OPTED_OUT");

            return true;
        }

        public async Task<StudyBuddy?> FindMatchAsync(int userId, int courseId)
        {
            return await GetByUserAndCourseAsync(userId, courseId);
        }

        public async Task<bool> CreateMatchAsync(int userId1, int courseId, int userId2)
        {
            var studyBuddy1 = await GetByUserAndCourseAsync(userId1, courseId);
            var studyBuddy2 = await GetByUserAndCourseAsync(userId2, courseId);

            if (studyBuddy1 == null || studyBuddy2 == null ||
                !studyBuddy1.IsOptedIn || !studyBuddy2.IsOptedIn ||
                studyBuddy1.BuddyId.HasValue || studyBuddy2.BuddyId.HasValue)
            {
                return false;
            }

            var matchedAt = DateTime.UtcNow;

            studyBuddy1.BuddyId = userId2;
            studyBuddy1.MatchedAt = matchedAt;

            studyBuddy2.BuddyId = userId1;
            studyBuddy2.MatchedAt = matchedAt;

            await _context.SaveChangesAsync();

            // Reload the entities to get the updated Buddy navigation properties
            await _context.Entry(studyBuddy1).Reference(sb => sb.Buddy).LoadAsync();
            await _context.Entry(studyBuddy2).Reference(sb => sb.Buddy).LoadAsync();

            Console.WriteLine($"Study buddy match created between users {userId1} and {userId2} for course {courseId}");

            // Notify both users about the match via WebSocket
            await WebSocketHandler.BroadcastStudyBuddyUpdate(userId1, courseId, "MATCHED", studyBuddy1, studyBuddy2.ContactPreference);
            await WebSocketHandler.BroadcastStudyBuddyUpdate(userId2, courseId, "MATCHED", studyBuddy2, studyBuddy1.ContactPreference);

            return true;
        }

        public async Task<bool> RemoveMatchAsync(int userId, int courseId)
        {
            var studyBuddy = await GetByUserAndCourseAsync(userId, courseId);
            if (studyBuddy?.BuddyId == null) return false;

            var buddyId = studyBuddy.BuddyId.Value;
            var buddy = await GetByUserAndCourseAsync(buddyId, courseId);

            // Remove the connection from both sides
            studyBuddy.BuddyId = null;
            studyBuddy.MatchedAt = null;

            if (buddy != null)
            {
                buddy.BuddyId = null;
                buddy.MatchedAt = null;
            }

            await _context.SaveChangesAsync();

            // Notify both users about the disconnection via WebSocket
            await WebSocketHandler.BroadcastStudyBuddyUpdate(userId, courseId, "DISCONNECTED", studyBuddy);
            if (buddy != null)
            {
                await WebSocketHandler.BroadcastStudyBuddyUpdate(buddyId, courseId, "DISCONNECTED", buddy);
            }

            return true;
        }

        public async Task<IEnumerable<StudyBuddy>> GetUnmatchedUsersForCourseAsync(int courseId, int excludeUserId)
        {
            return await _context.StudyBuddies
                .Include(sb => sb.User)
                .Where(sb => sb.CourseId == courseId &&
                           sb.IsOptedIn &&
                           sb.BuddyId == null &&
                           sb.UserId != excludeUserId)
                .ToListAsync();
        }

        private async Task TryCreateMatchAsync(StudyBuddy newStudyBuddy)
        {
            var availableMatches = await GetUnmatchedUsersForCourseAsync(
                newStudyBuddy.CourseId,
                newStudyBuddy.UserId);

            if (availableMatches.Any())
            {
                // Pick a random available match
                var random = new Random();
                var selectedMatch = availableMatches.ElementAt(random.Next(availableMatches.Count()));

                await CreateMatchAsync(newStudyBuddy.UserId, newStudyBuddy.CourseId, selectedMatch.UserId);
            }
        }
    }
}
