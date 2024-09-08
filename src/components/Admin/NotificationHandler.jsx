import { useEffect, useRef } from "react";
import notif from "@assets/notif.mp3";

const NotificationHandler = ({ timetableCondition }) => {
  const notifTitle = "Timetabler";
  const notifBody = "Your timetable is ready!";
  const originalTitle = useRef(document.title);
  const timeoutId = useRef(null);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && timetableCondition === "success") {
        // User returned to the tab
        timeoutId.current = setTimeout(() => {
          document.title = originalTitle.current;
        }, 1000);
      }
    };

    if (timetableCondition === "success" && document.hidden) {
      document.title = "Timetable ready!";
      const audio = new Audio(notif);
      audio.volume = 0.4;
      audio.play();

      if (Notification.permission === "granted") {
        new Notification(notifTitle, {
          body: notifBody,
        });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            new Notification(notifTitle, {
              body: notifBody,
            });
          }
        });
      }
    } else if (timetableCondition === "running") {
      document.title = "Generating...";
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.title = originalTitle.current;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }
    };
  }, [timetableCondition]);

  return null;
};

export default NotificationHandler;
