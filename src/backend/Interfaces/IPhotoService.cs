namespace backend.Interfaces
{
    public interface IPhotoService
    {
        string AddPhoto(IFormFile file);
        void DeletePhoto(string url);
        bool IsPhoto(IFormFile file);
    }
}