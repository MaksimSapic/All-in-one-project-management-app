using System.ComponentModel.DataAnnotations;

namespace backend.DTO
{
    public class EmailDto
    {
        [EmailAddress]
        public string Receiver{get; set;}
    }
}