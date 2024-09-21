using backend.Entities;

namespace backend.Interfaces
{
    public interface ITokenService
    {
        string CreateToken(AppUser user);
    }
}