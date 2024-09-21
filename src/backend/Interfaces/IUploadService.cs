namespace backend.Interfaces
{
    public interface IUploadService
    {
        string AddFile(IFormFile file);
        void DeleteFile(string url);
    }
}