using backend.Entities;
using backend.DTO;
namespace backend.Interfaces
{
    public interface INotificationsHub
    {
        Task Notify(NotificationDto notification); // ova je glavna, ova pusta notifikaciju korisnicima
        Task newNotifications();
        Task recieveNotifications(List<NotificationDto> notifications);
        Task InvokeGetNotifications();
        Task InvokeGetAllNotifications();
        Task recieveAllNotifications(List<NotificationDto> notifications);
        Task readNotifications(List<int> notifications);
        Task notifyState(bool flag);
    }
}