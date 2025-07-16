using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using backend.Repositories;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Text;

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class UserController : ControllerBase
    {
        private readonly IUserRepository _userRepository;
        private readonly IConfiguration _configuration;

        public UserController(IUserRepository userRepository, IConfiguration configuration)
        {
            _userRepository = userRepository;
            _configuration = configuration;
        }

        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            var userIdClaim = User.FindFirst("userId")?.Value;
            if (userIdClaim == null || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new { message = "Invalid user token" });
            }

            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            return Ok(new
            {
                id = user.Id,
                username = user.Username,
                displayName = user.DisplayName
            });
        }

        [HttpPut("profile/display-name")]
        public async Task<IActionResult> UpdateDisplayName([FromBody] UpdateDisplayNameRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.DisplayName))
            {
                return BadRequest(new { message = "Display name cannot be empty" });
            }

            if (request.DisplayName.Length > 50)
            {
                return BadRequest(new { message = "Display name cannot exceed 50 characters" });
            }

            var userIdClaim = User.FindFirst("userId")?.Value;
            if (userIdClaim == null || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new { message = "Invalid user token" });
            }

            var updatedUser = await _userRepository.UpdateDisplayNameAsync(userId, request.DisplayName.Trim());
            if (updatedUser == null)
            {
                return NotFound(new { message = "User not found" });
            }

            // Generate a new JWT token with the updated display name
            var newToken = GenerateJwtToken(updatedUser.Id, updatedUser.Username, updatedUser.DisplayName);

            return Ok(new
            {
                id = updatedUser.Id,
                username = updatedUser.Username,
                displayName = updatedUser.DisplayName,
                token = newToken,
                message = "Display name updated successfully"
            });
        }

        private string GenerateJwtToken(int userId, string username, string displayName)
        {
            var jwtKey = _configuration["Jwt:Key"];
            var jwtIssuer = _configuration["Jwt:Issuer"];
            var jwtAudience = _configuration["Jwt:Audience"];

            if (string.IsNullOrEmpty(jwtKey))
            {
                throw new InvalidOperationException("JWT Key is not configured.");
            }

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, username),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim("userId", userId.ToString()),
                new Claim(ClaimTypes.Name, username),
                new Claim("displayName", displayName)
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: jwtIssuer,
                audience: jwtAudience,
                claims: claims,
                expires: DateTime.Now.AddHours(24),
                signingCredentials: creds);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }

    public class UpdateDisplayNameRequest
    {
        public required string DisplayName { get; set; }
    }
}
