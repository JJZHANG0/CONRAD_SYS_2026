"""Create Django admin + demo teacher/students/team for production setup."""
from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.core.management.base import BaseCommand

User = get_user_model()

ADMIN = {
    "username": "admin",
    "password": "Admin@2026Stem",
    "email": "admin@stemhub.com",
}


class Command(BaseCommand):
    help = "Create admin superuser and demo teacher/student accounts"

    def add_arguments(self, parser):
        parser.add_argument(
            "--skip-demo",
            action="store_true",
            help="Only create admin, skip demo teacher/students/team",
        )

    def handle(self, *args, **options):
        admin, created = User.objects.get_or_create(
            username=ADMIN["username"],
            defaults={
                "email": ADMIN["email"],
                "role": User.Role.TEACHER,
                "display_name": "系统管理员",
                "is_staff": True,
                "is_superuser": True,
            },
        )
        admin.set_password(ADMIN["password"])
        admin.is_staff = True
        admin.is_superuser = True
        admin.save()
        action = "Created" if created else "Updated"
        self.stdout.write(self.style.SUCCESS(f"{action} admin: {ADMIN['username']}"))

        if not options["skip_demo"]:
            call_command("seed_demo")

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("=== Accounts ready ==="))
        self.stdout.write(f"Admin panel : http://39.102.56.62/admin/")
        self.stdout.write(f"Admin login : {ADMIN['username']} / {ADMIN['password']}")
        if not options["skip_demo"]:
            self.stdout.write("Teacher demo: teacher_demo / demo123456")
            self.stdout.write("Students    : student01 ~ student05 / demo123456")
        self.stdout.write("")
        self.stdout.write("In admin you can add Users, Teams, and Team Members in bulk.")
