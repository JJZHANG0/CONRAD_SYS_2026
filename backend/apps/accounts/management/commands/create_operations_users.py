"""Create operations admin accounts with access to all teams and students."""
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

User = get_user_model()

OPERATIONS_USERS = [
    {
        "username": "ops_cheng",
        "display_name": "程雪晴",
        "email": "chengxueqing@conrad.local",
    },
    {
        "username": "ops_zhang",
        "display_name": "张雪航",
        "email": "zhangxuehang@conrad.local",
    },
]

DEFAULT_PASSWORD = "StemHub@2026"


class Command(BaseCommand):
    help = "Create operations admin accounts (view all teams and students)"

    def add_arguments(self, parser):
        parser.add_argument(
            "--password",
            default=DEFAULT_PASSWORD,
            help=f"Initial password (default: {DEFAULT_PASSWORD})",
        )

    def handle(self, *args, **options):
        password = options["password"]
        for data in OPERATIONS_USERS:
            user, created = User.objects.update_or_create(
                username=data["username"],
                defaults={
                    "email": data["email"],
                    "role": User.Role.OPERATIONS,
                    "display_name": data["display_name"],
                    "is_staff": True,
                    "is_active": True,
                },
            )
            user.set_password(password)
            user.save()
            action = "Created" if created else "Updated"
            self.stdout.write(self.style.SUCCESS(f"{action}: {user.display_name} ({user.username})"))

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("Operations accounts ready."))
        self.stdout.write("Login with Chinese name + password:")
        for data in OPERATIONS_USERS:
            self.stdout.write(f"  {data['display_name']} / {password}")
        self.stdout.write("")
        self.stdout.write("They can view ALL teams and ALL student logs on the dashboard.")
