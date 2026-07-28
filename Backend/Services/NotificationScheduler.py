import threading
import time
from firebase_admin import messaging

from Services.TaskDriver import TaskDriver
from Services.TokenDriver import TokenDriver
from Services.SocialDriver import SocialDriver


class NotificationScheduler:
    def __init__(self, app=None, interval_seconds=300):
        self.interval = interval_seconds
        self.running = False
        self.thread = None
        self.app = app  # <-- now the scheduler owns a reference to the app

    def init_app(self, app):
        """Optional two-step init, mirrors the Flask extension pattern
        (db.init_app(app), scheduler.init_app(app), etc.)."""
        self.app = app

    def start(self):
        if self.app is None:
            raise RuntimeError(
                "NotificationScheduler has no app. Pass app=... to the "
                "constructor or call init_app(app) before start()."
            )
        if not self.running:
            self.running = True
            self.thread = threading.Thread(target=self._run, daemon=True)
            self.thread.start()
            print(f"Notification scheduler started, checking every {self.interval} seconds")

    def stop(self):
        self.running = False
        if self.thread:
            self.thread.join()
        print("Notification scheduler stopped")

    def _run(self):
        while self.running:
            try:
                # Push the app context ONCE per loop iteration, so every
                # DB call and driver call made during this tick sees
                # current_app correctly.
                with self.app.app_context():
                    self._check_and_send_notifications()
                    self._check_and_send_friend_request_notifications()
            except Exception as e:
                print(f"Error in notification scheduler: {e}")
            time.sleep(self.interval)

    def _check_and_send_notifications(self):
        tasks, error = TaskDriver.find_overdue_tasks()
        if not tasks:
            return
        elif error:
            print(f"Error fetching overdue tasks: {error}")
            return

        sent_task_ids = set()
        for task in tasks:
            task_id = str(task.get("_id"))
            if task_id in sent_task_ids:
                continue

            user_id = task.get("user_id")
            if not user_id:
                continue

            task_name = task.get("name", "Task")

            tokens, token_error = TokenDriver.get_all_tokens_by_user(user_id)
            if token_error or not tokens:
                continue

            for token_doc in tokens:
                fcm_token = token_doc.get("token")
                if fcm_token:
                    self._send_notification(fcm_token, task_name, task_id)

            sent_task_ids.add(task_id)

        print(f"Notification scheduler: processed {len(sent_task_ids)} overdue tasks")

    def _check_and_send_friend_request_notifications(self):
        pending_requests, error = SocialDriver.find_pending_friend_requests()

        if error:
            print(f"Error fetching pending friend requests: {error}")
            return
        elif not pending_requests:
            return

        sent_request_ids = set()

        for friendship in pending_requests:
            friendship_id = str(friendship.get("_id"))
            if friendship_id in sent_request_ids:
                continue

            user2_email = friendship.get("User2Email")
            if not user2_email:
                continue

            user2_id, user_id_error = SocialDriver.resolve_user_id_by_email(user2_email)
            if user_id_error or not user2_id:
                continue

            tokens, token_error = TokenDriver.get_all_tokens_by_user(user2_id)
            if token_error or not tokens:
                continue

            for token_doc in tokens:
                fcm_token = token_doc.get("token")
                if fcm_token:
                    self._send_friend_request_notification(fcm_token, friendship_id)

            sent_request_ids.add(friendship_id)

        print(
            f"Notification scheduler: processed {len(sent_request_ids)} pending friend request notifications"
        )

    def _send_notification(self, token, task_name, task_id):
        try:
            message = messaging.Message(
                notification=messaging.Notification(
                    title="Task Reminder",
                    body=f"'{task_name}' is due now!"
                ),
                token=token,
                data={
                    "task_id": task_id,
                    "type": "task_reminder"
                }
            )
            response = messaging.send(message)
            print(f"Successfully sent notification for task {task_id}: {response}")
        except Exception as e:
            print(f"Error sending notification to {token[:20]}...: {e}")

    def _send_friend_request_notification(self, token, friendship_id):
        try:
            message = messaging.Message(
                notification=messaging.Notification(
                    title="Friend Request",
                    body="You have a pending friend request waiting for your response."
                ),
                token=token,
                data={
                    "friendship_id": friendship_id,
                    "type": "friend_request_pending"
                }
            )
            response = messaging.send(message)
            print(f"Successfully sent friend request reminder {friendship_id}: {response}")
        except Exception as e:
            print(f"Error sending friend request reminder to {token[:20]}...: {e}")
