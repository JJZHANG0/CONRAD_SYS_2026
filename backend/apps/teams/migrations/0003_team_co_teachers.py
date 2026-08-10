from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("teams", "0002_teacherdailyevaluation"),
    ]

    operations = [
        migrations.AddField(
            model_name="team",
            name="co_teachers",
            field=models.ManyToManyField(
                blank=True,
                related_name="co_taught_teams",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
