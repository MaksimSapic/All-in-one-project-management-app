namespace backend.Entities;
#nullable enable
#nullable enable
public class Comment
{
    public int Id {get; set;}
    public int TaskId {get; set;}
    public string? Content {get; set;}
    public DateTime MessageSent { get; set; } = DateTime.UtcNow.AddHours(2);
    public int SenderId {get; set;}
    public string? SenderFirstName {get; set;}
    public string? SenderLastName {get; set;}
    public string? FileUrl {get; set;}
    public bool Edited { get; set; }
}