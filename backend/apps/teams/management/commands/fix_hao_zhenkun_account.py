from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.db.models import Q


User = get_user_model()

DEFAULT_PASSWORD = "Conrad@2026!"
OLD_USERNAME = "teacher_haozhenyu"
OLD_DISPLAY_NAME = "郝震煜"
NEW_USERNAME = "teacher_haozhenkun"
NEW_DISPLAY_NAME = "郝震焜"


class Command(BaseCommand):
    help = "Correct 郝震焜's teacher account without changing its team relationships"

    def add_arguments(self, parser):
        parser.add_argument(
            "--password",
            default=DEFAULT_PASSWORD,
            help="Password assigned to the corrected account",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        candidates = list(
            User.objects.filter(
                Q(username__in=(OLD_USERNAME, NEW_USERNAME))
                | Q(display_name__in=(OLD_DISPLAY_NAME, NEW_DISPLAY_NAME))
            ).distinct()
        )
        if not candidates:
            raise CommandError("Teacher account for 郝震焜 was not found")
        if len(candidates) > 1:
            accounts = ", ".join(user.username for user in candidates)
            raise CommandError(f"Multiple possible teacher accounts found: {accounts}")

        user = candidates[0]
        if user.role != User.Role.TEACHER:
            raise CommandError(f"{user.username} is not a teacher account")
        if User.objects.exclude(pk=user.pk).filter(username=NEW_USERNAME).exists():
            raise CommandError(f"Username already exists: {NEW_USERNAME}")

        user.username = NEW_USERNAME
        user.display_name = NEW_DISPLAY_NAME
        if user.email == f"{OLD_USERNAME}@conrad.local":
            user.email = f"{NEW_USERNAME}@conrad.local"
        user.is_active = True
        user.set_password(options["password"])
        user.save()

        self.stdout.write(
            self.style.SUCCESS(
                f"Corrected teacher account: {NEW_DISPLAY_NAME} ({NEW_USERNAME})"
            )
        )
