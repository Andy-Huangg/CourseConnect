using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using backend.Models;
using backend.Repositories;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly AppDbContext _context;
        private readonly ICourseRepository _courseRepo;

        public AuthController(IConfiguration configuration, AppDbContext context, ICourseRepository courseRepo)
        {
            _configuration = configuration;
            _context = context;
            _courseRepo = courseRepo;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] UserLoginDto registerDto)
        {
            // Check if the username already exists
            var existingUser = await _context.User.FirstOrDefaultAsync(u => u.Username == registerDto.Username);
            if (existingUser != null)
            {
                return BadRequest(new { message = "Username already exists." });
            }

            // Hash the password
            var hashedPassword = BCrypt.Net.BCrypt.HashPassword(registerDto.Password);

            // Create a new user
            var newUser = new User
            {
                Username = registerDto.Username,
                PasswordHash = hashedPassword,
                DisplayName = registerDto.Username
            };

            // Save the user to the database
            _context.User.Add(newUser);
            await _context.SaveChangesAsync();

            // Automatically enroll the user in the Global course (courseId = 1)
            const int globalCourseId = 1;
            try
            {
                await _courseRepo.EnrollUserAsync(newUser.Id, globalCourseId);
            }
            catch (Exception ex)
            {
                // Log the error but don't fail registration if Global course enrollment fails
                Console.WriteLine($"Warning: Failed to auto-enroll user {newUser.Id} in Global course: {ex.Message}");
            }

            var token = GenerateJwtToken(newUser.Id, newUser.Username);

            return Ok(new { message = "User registered successfully.", token });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] UserLoginDto loginDto)
        {
            var user = await _context.User.FirstOrDefaultAsync(u => u.Username == loginDto.Username);

            if (user == null)
            {
                return Unauthorized(new { message = "Invalid username or password." });
            }

            // Validate the hashed password
            if (!BCrypt.Net.BCrypt.Verify(loginDto.Password, user.PasswordHash))
            {
                return Unauthorized(new { message = "Invalid username or password." });
            }

            // Generate JWT token
            var token = GenerateJwtToken(user.Id, user.Username);
            return Ok(new { token });
        }

        private string GenerateJwtToken(int userId, string username)
        {
            var jwtKey = _configuration["Jwt:Key"];
            var jwtIssuer = _configuration["Jwt:Issuer"];
            var jwtAudience = _configuration["Jwt:Audience"];

            if (string.IsNullOrEmpty(jwtKey))
            {
                throw new InvalidOperationException("JWT Key is not configured.");
            }

            // JWT Claims:
            // - Sub: Username (standard JWT subject claim for interoperability)  
            // - userId: User ID (custom claim for our application's user identification)
            // - Name: Username (for display purposes)
            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, username), // Username in sub claim
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim("userId", userId.ToString()), // Custom userId claim for our app
                new Claim(ClaimTypes.Name, username) // Username for display purposes
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: jwtIssuer,
                audience: jwtAudience,
                claims: claims,
                expires: DateTime.Now.AddDays(30),
                signingCredentials: creds);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }

    public class UserLoginDto
    {
        public required string Username { get; set; }
        public required string Password { get; set; }
    }
}