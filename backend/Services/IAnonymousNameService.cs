namespace backend.Services
{
    public interface IAnonymousNameService
    {
        string GenerateAnonymousName(int userId, int courseId);
    }
}
