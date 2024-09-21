using backend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
namespace backend.Services
{
    [Authorize]
    public class PhotoService : IPhotoService
    {
        public readonly string _path =Path.Combine(Directory.GetCurrentDirectory(),"Assets","Images");

        public string AddPhoto(IFormFile file)
        {
            if (file.Length > 0)
            {
                string filepath = Path.Combine(_path, file.FileName);
                this.MakeAvatar(file);
                using (Stream filestream = new FileStream(filepath, FileMode.Create))
                {
                    file.CopyTo(filestream);
                }
                return file.FileName;
            }
            else return null;
        }

        public void DeletePhoto(string url)
        {
            string path_check=Path.Combine(_path,url);
            string avatar_check = Path.Combine(_path,"AVATAR_"+url);
            if (File.Exists(path_check))
            {
                File.Delete(path_check);
            }
            if(File.Exists(avatar_check))
            {
                File.Delete(avatar_check);
            }
        }
        public bool IsPhoto(IFormFile file){
            return file.ContentType.StartsWith("image/",StringComparison.OrdinalIgnoreCase);
        }
        public void MakeAvatar(IFormFile file){
            using Image image = Image.Load(file.OpenReadStream());
            image.Mutate(x => x.Resize(image.Width/2,image.Height/2));
            string alterpath = Path.Combine(_path,"AVATAR_"+file.FileName);
            image.Save(alterpath);
        }
    }
}