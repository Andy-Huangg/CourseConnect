using System.Security.Cryptography;
using System.Text;

namespace backend.Services
{
    public class AnonymousNameService : IAnonymousNameService
    {
        private static readonly string[] Adjectives = {
            "Clever", "Bright", "Swift", "Brave", "Kind", "Wise", "Bold", "Cool", 
            "Smart", "Quick", "Sharp", "Calm", "Noble", "Lucky", "Witty", "Keen",
            "Happy", "Gentle", "Strong", "Agile", "Creative", "Focused", "Peaceful",
            "Curious", "Friendly", "Cheerful", "Confident", "Energetic", "Thoughtful"
        };

        private static readonly string[] Animals = {
            "Fox", "Wolf", "Eagle", "Tiger", "Lion", "Bear", "Dolphin", "Owl",
            "Hawk", "Panda", "Rabbit", "Deer", "Falcon", "Whale", "Cat", "Dog",
            "Horse", "Elephant", "Penguin", "Turtle", "Octopus", "Butterfly", "Bee",
            "Shark", "Leopard", "Cheetah", "Jaguar", "Lynx", "Raven", "Swan"
        };

        public string GenerateAnonymousName(int userId, int courseId)
        {
            // Create a deterministic hash based on userId and courseId
            // This ensures the same user gets the same anonymous name in the same course
            var input = $"{userId}-{courseId}";
            var hashBytes = SHA256.HashData(Encoding.UTF8.GetBytes(input));
            
            // Use the hash to select adjective and animal
            var adjectiveIndex = Math.Abs(BitConverter.ToInt32(hashBytes, 0)) % Adjectives.Length;
            var animalIndex = Math.Abs(BitConverter.ToInt32(hashBytes, 4)) % Animals.Length;
            
            // Generate a number from the hash for uniqueness
            var number = Math.Abs(BitConverter.ToInt32(hashBytes, 8)) % 1000;
            
            return $"{Adjectives[adjectiveIndex]}{Animals[animalIndex]}{number:D3}";
        }
    }
}
