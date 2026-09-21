from django.db import migrations


def correct_qinglan_category(apps, schema_editor):
    Team = apps.get_model("teams", "Team")
    Team.objects.filter(
        name__in=("TEAM「清澜环」", "TEAM 「清澜环」"),
    ).update(challenge_category="Energy & Environment")


class Migration(migrations.Migration):
    dependencies = [
        ("teams", "0004_team_product_links"),
    ]

    operations = [
        migrations.RunPython(correct_qinglan_category, migrations.RunPython.noop),
    ]
