namespace backend.Entities
{
    public class UserRequest
    {
        public int Id{get; set;}
        public string Email{get; set;}
        public string Token{get; set;}
        public DateTime ExpirationDate{get; set;}
        public bool IsUsed{get; set;}
    }
}