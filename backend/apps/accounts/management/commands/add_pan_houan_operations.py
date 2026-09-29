from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction


User = get_user_model()

DEFAULT_PASSWORD = "Conrad@2026!"
USERNAME = "ops_pan"
DISPLAY_NAME = "潘厚安"
EMAIL = "panhouan@conrad.local"


class Command(BaseCommand):
    help = "Create or promote 潘厚安 as an operations user with access to all teams"

    def add_arguments(self, parser):
        parser.add_argument(
            "--password",
            default=DEFAULT_PASSWORD,
            help="Password assigned to the operations account",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        matches = User.objects.filter(display_name=DISPLAY_NAME)
        if matches.count() > 1:
            raise CommandError(f"Multiple accounts use the name {DISPLAY_NAME}")

        user = matches.first()
        created = user is None
        if created:
            if User.objects.filter(username=USERNAME).exists():
                raise CommandError(f"Username already exists: {USERNAME}")
            if User.objects.filter(email=EMAIL).exists():
                raise CommandError(f"Email already exists: {EMAIL}")
            user = User(username=USERNAME, email=EMAIL)
        elif User.objects.exclude(pk=user.pk).filter(username=USERNAME).exists():
            raise CommandError(f"Username already exists: {USERNAME}")

        user.username = USERNAME
        user.display_name = DISPLAY_NAME
        user.role = User.Role.OPERATIONS
        user.is_active = True
        user.is_staff = True
        user.set_password(options["password"])
        user.save()

        action = "Created" if created else "Updated"
        self.stdout.write(
            self.style.SUCCESS(
                f"{action} operations account: {DISPLAY_NAME} ({USERNAME})"
            )
        )
