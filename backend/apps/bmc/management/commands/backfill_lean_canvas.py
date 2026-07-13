from django.core.management.base import BaseCommand

from apps.bmc.models import LeanCanvas
from apps.teams.models import Team
from apps.teams.services import create_lean_canvas


class Command(BaseCommand):
    help = "Create empty Lean Canvas records for teams that do not have one yet"

    def handle(self, *args, **options):
        created = 0
        for team in Team.objects.all():
            if not LeanCanvas.objects.filter(team=team).exists():
                create_lean_canvas(team)
                created += 1
        self.stdout.write(self.style.SUCCESS(f"Lean Canvas backfill complete: {created} created"))
